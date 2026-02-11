"""
Setup script to create test data for the WasteToWealth application
This script helps set up test accounts for running Selenium tests
"""
import requests
import json
import time

def setup_test_farmer():
    """Create a test farmer account for testing purposes."""
    print("Setting up test farmer account...")
    
    # Farmer registration data
    farmer_data = {
        "Farmername": "Test Farmer",
        "village": "Test Village",
        "mobileNumber": "9876543210",
        "email": "farmer@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post("http://localhost:8080/farmer/register", data=farmer_data)
        if response.status_code == 200:
            print("Test farmer account created successfully!")
            return True
        else:
            print(f"Failed to create farmer account. Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error creating farmer account: {e}")
        return False

def setup_test_company():
    """Create a test company account for testing purposes."""
    print("Setting up test company account...")
    
    # Company registration data
    company_data = {
        "companyName": "Test Company",
        "ownerName": "Test Owner",
        "industryType": "Recycling",
        "email": "company@example.com",
        "contactNumber": "9876543210",
        "address": "123 Test Street",
        "district": "Test District",
        "state": "Test State",
        "wasteTypesRequired": "Organic",
        "minQuantityRequired": "50",
        "gstNumber": "12ABCDE1234F1Z5",
        "companyLicenseNumber": "COMP123456",
        "password": "password123"
    }
    
    try:
        response = requests.post("http://localhost:8080/company/login", data=company_data)
        if response.status_code == 200:
            print("Test company account created successfully!")
            return True
        else:
            print(f"Failed to create company account. Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error creating company account: {e}")
        return False

def main():
    """Main function to set up test data."""
    print("Setting up test data for WasteToWealth application...")
    print("="*50)
    
    # Wait a bit to ensure server is running
    time.sleep(2)
    
    success_count = 0
    
    # Set up farmer account
    if setup_test_farmer():
        success_count += 1
    
    # Wait a bit between requests
    time.sleep(1)
    
    # Set up company account
    if setup_test_company():
        success_count += 1
    
    print("="*50)
    print(f"Setup completed. {success_count}/2 test accounts created.")
    
    if success_count < 2:
        print("\nWarning: Not all test accounts were created successfully.")
        print("Make sure the application server is running on http://localhost:8080")
        print("and MongoDB is accessible.")

if __name__ == "__main__":
    main()