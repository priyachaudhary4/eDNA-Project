import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('researcher_profile');
        return saved ? JSON.parse(saved) : {
            name: 'Dr. Sarah Chen',
            designation: 'Lead Biodiversity Researcher',
            division: 'Ecological Genomic Division',
            id: 'BS-8829-QX',
            image: null
        };
    });

    useEffect(() => {
        localStorage.setItem('researcher_profile', JSON.stringify(profile));
    }, [profile]);

    const updateProfile = (newData) => {
        setProfile(prev => ({ ...prev, ...newData }));
    };

    return (
        <ProfileContext.Provider value={{ profile, updateProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => useContext(ProfileContext);
