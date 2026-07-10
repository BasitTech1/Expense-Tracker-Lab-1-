// scripts/createAdmin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to database
        await connectDB();

        // Admin credentials - Change these as needed
        const adminData = {
            fullName: 'System Administrator',
            email: 'admin@expensetracker.com',
            password: 'Admin@2024#Secure', 
            gender: 'Male',
            country: 'Pakistan',
            role: 'admin',
            isActive: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create(adminData);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

// Run the script
createAdmin();