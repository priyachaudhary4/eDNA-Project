"""
dna_embedder.py — DNABERT-2 Embedding Generator
===============================================
Extracts high-dimensional embeddings for DNA sequences using DNABERT-2.
No prediction or similarity ranking logic here.
"""

import os
import logging
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel, BertConfig

logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))


def _resolve_path(path: str) -> str:
    """Resolve a path relative to the project root if it's not absolute."""
    if os.path.isabs(path):
        return path
    return os.path.join(PROJECT_ROOT, path)


class DNABERT2Embedder(nn.Module):
    """
    Wraps DNABERT-2 backbone to produce [CLS] embeddings for DNA sequences.
    No classification head — embeddings are used as features.
    """

    def __init__(self, model_name: str):
        super().__init__()

        resolved_model = _resolve_path(model_name)
        if os.path.isdir(resolved_model):
            model_name = resolved_model

        logger.info(f"Loading DNABERT-2 backbone from: {model_name}")

        bert_config = BertConfig.from_pretrained(model_name, trust_remote_code=True)

        os.environ["TRANSFORMERS_ALLOW_UNSAFE_DESERIALIZATION"] = "1"
        try:
            self.backbone = AutoModel.from_pretrained(
                model_name,
                config=bert_config,
                trust_remote_code=True,
            )
        finally:
            os.environ.pop("TRANSFORMERS_ALLOW_UNSAFE_DESERIALIZATION", None)

        self._fix_meta_tensors(self.backbone)
        self.hidden_size = bert_config.hidden_size
        logger.info(f"DNABERT-2 backbone ready — hidden_size={self.hidden_size}")

    @staticmethod
    def _fix_meta_tensors(module: nn.Module):
        """Materialize any parameter/buffer stuck on the 'meta' device."""
        for name, param in list(module.named_parameters()):
            if param.device.type == "meta":
                parts = name.rsplit(".", 1)
                parent = module
                if len(parts) == 2:
                    for attr in parts[0].split("."):
                        parent = getattr(parent, attr)
                    attr_name = parts[1]
                else:
                    attr_name = parts[0]
                new_param = nn.Parameter(
                    torch.zeros(param.shape, dtype=param.dtype, device="cpu"),
                    requires_grad=param.requires_grad,
                )
                setattr(parent, attr_name, new_param)

        for name, buf in list(module.named_buffers()):
            if buf.device.type == "meta":
                parts = name.rsplit(".", 1)
                parent = module
                if len(parts) == 2:
                    for attr in parts[0].split("."):
                        parent = getattr(parent, attr)
                    attr_name = parts[1]
                else:
                    attr_name = parts[0]
                new_buf = torch.zeros(buf.shape, dtype=buf.dtype, device="cpu")
                setattr(parent, attr_name, new_buf)

        for sub in module.modules():
            if hasattr(sub, "rebuild_alibi_tensor") and hasattr(sub, "alibi"):
                size = getattr(sub, "_current_alibi_size", 512)
                sub.rebuild_alibi_tensor(size=size, device=torch.device("cpu"))

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        outputs = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        if isinstance(outputs, tuple):
            sequence_output = outputs[0]
        else:
            sequence_output = outputs.last_hidden_state

        # [CLS] embedding (first position), L2-normalized 
        cls_embedding = sequence_output[:, 0, :]  # (B, hidden_size)
        cls_embedding = F.normalize(cls_embedding, p=2, dim=-1)
        return cls_embedding


def load_tokenizer(model_name: str) -> AutoTokenizer:
    resolved = _resolve_path(model_name)
    if os.path.isdir(resolved):
        model_name = resolved
    return AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)


def load_embedder_and_tokenizer(model_name: str) -> tuple[DNABERT2Embedder, AutoTokenizer, torch.device]:
    """
    Loads embedder and tokenizer, handles device placement.
    """
    if torch.backends.mps.is_available():
        device = torch.device("mps")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")

    embedder = DNABERT2Embedder(model_name)
    embedder.to(device)
    embedder.eval()

    tokenizer = load_tokenizer(model_name)

    return embedder, tokenizer, device


def get_embedding(
    sequence: str, 
    embedder: DNABERT2Embedder, 
    tokenizer: AutoTokenizer, 
    device: torch.device, 
    max_len: int = 512
) -> torch.Tensor:
    """
    Generate a 1D embedding tensor for a single DNA sequence.
    """
    embedder.eval()
    encoding = tokenizer(
        [sequence],
        padding="max_length",
        truncation=True,
        max_length=max_len,
        return_tensors="pt",
    )
    encoding = {k: v.to(device) for k, v in encoding.items()}

    with torch.no_grad():
        emb = embedder(encoding["input_ids"], encoding["attention_mask"])
    
    return emb.squeeze(0).cpu() # Return as 1D CPU tensor
