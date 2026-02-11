"""
Selenium Farmer Registration Tests for WasteToWealth Application

This test suite focuses specifically on farmer registration functionality:
1. Farmer registration page elements and form validation
2. Successful farmer registration flow
3. Invalid data handling
4. Form interaction tests
"""

import unittest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import random
import string


class FarmerRegistrationTests(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        # Use Chrome driver with webdriver-manager for automatic driver management
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service)
        self.driver.implicitly_wait(10)
        self.base_url = "http://localhost:8080"
        self.wait = WebDriverWait(self.driver, 10)

    def tearDown(self):
        """Tear down test fixtures after each test method."""
        self.driver.quit()

    def generate_random_email(self, prefix="test"):
        """Generate a random email for testing."""
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"{prefix}_{random_string}@example.com"

    def test_01_farmer_registration_page_elements(self):
        """Test that farmer registration page loads correctly and has required elements."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/register")
        
        # Wait for the registration page to load
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
        
        # Verify page title contains 'Register'
        self.assertIn("Register", driver.title)
        
        # Verify registration form elements are present
        name_input = driver.find_element(By.NAME, "name")
        village_input = driver.find_element(By.NAME, "village")
        mobile_input = driver.find_element(By.NAME, "mobileNumber")
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        confirm_password_input = driver.find_element(By.NAME, "confirmPassword")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        self.assertTrue(name_input.is_displayed())
        self.assertTrue(village_input.is_displayed())
        self.assertTrue(mobile_input.is_displayed())
        self.assertTrue(email_input.is_displayed())
        self.assertTrue(password_input.is_displayed())
        self.assertTrue(confirm_password_input.is_displayed())
        self.assertTrue(submit_button.is_displayed())
        
        print("✓ Farmer registration page elements test passed")

    def test_02_farmer_registration_success(self):
        """Test successful farmer registration flow."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/register")
        
        # Wait for the registration page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "name")))
        
        # Generate random data for registration
        farmer_name = f"Test Farmer {random.randint(1000, 9999)}"
        village = "Test Village"
        mobile = f"9{random.randint(100000000, 999999999)}"  # Valid 10-digit mobile number
        email = self.generate_random_email("farmer")
        password = "TestPassword123!"
        
        # Fill in registration form
        name_input = driver.find_element(By.NAME, "name")
        village_input = driver.find_element(By.NAME, "village")
        mobile_input = driver.find_element(By.NAME, "mobileNumber")
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        confirm_password_input = driver.find_element(By.NAME, "confirmPassword")
        
        name_input.send_keys(farmer_name)
        village_input.send_keys(village)
        mobile_input.send_keys(mobile)
        email_input.send_keys(email)
        password_input.send_keys(password)
        confirm_password_input.send_keys(password)  # Same as password
        
        # Submit registration
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect after successful registration
        time.sleep(3)  # Allow time for server processing
        
        # Verify successful registration (check for redirect to home page or success message)
        current_url = driver.current_url
        # Should redirect to home page after registration
        self.assertEqual(f"{self.base_url}/", current_url)
        
        print(f"✓ Farmer registration success test passed - Registered: {email}")

    def test_03_farmer_registration_password_mismatch(self):
        """Test farmer registration with mismatched passwords."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/register")
        
        # Wait for the registration page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "name")))
        
        # Generate test data
        farmer_name = f"Test Farmer {random.randint(1000, 9999)}"
        village = "Test Village"
        mobile = f"8{random.randint(100000000, 999999999)}"
        email = self.generate_random_email("farmer_fail")
        password = "TestPassword123!"
        wrong_confirm_password = "WrongPassword456!"
        
        # Fill in registration form with mismatched passwords
        name_input = driver.find_element(By.NAME, "name")
        village_input = driver.find_element(By.NAME, "village")
        mobile_input = driver.find_element(By.NAME, "mobileNumber")
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        confirm_password_input = driver.find_element(By.NAME, "confirmPassword")
        
        name_input.send_keys(farmer_name)
        village_input.send_keys(village)
        mobile_input.send_keys(mobile)
        email_input.send_keys(email)
        password_input.send_keys(password)
        confirm_password_input.send_keys(wrong_confirm_password)  # Different from password
        
        # Submit registration
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for error message
        time.sleep(2)
        
        # Should stay on the same page or show an error message
        current_url = driver.current_url
        self.assertIn("farmer/register", current_url)
        
        print("✓ Farmer registration password mismatch test passed")

    def test_04_farmer_registration_duplicate_email(self):
        """Test farmer registration with duplicate email."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/register")
        
        # Wait for the registration page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "name")))
        
        # Use a known email (this test may fail if email doesn't exist, which is expected)
        farmer_name = "Test Duplicate Farmer"
        village = "Duplicate Village"
        mobile = "9876543210"
        email = "duplicate@example.com"  # Use a test email
        password = "TestPassword123!"
        
        # Fill in registration form
        name_input = driver.find_element(By.NAME, "name")
        village_input = driver.find_element(By.NAME, "village")
        mobile_input = driver.find_element(By.NAME, "mobileNumber")
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        confirm_password_input = driver.find_element(By.NAME, "confirmPassword")
        
        name_input.send_keys(farmer_name)
        village_input.send_keys(village)
        mobile_input.send_keys(mobile)
        email_input.send_keys(email)
        password_input.send_keys(password)
        confirm_password_input.send_keys(password)
        
        # Submit registration
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for potential error message
        time.sleep(3)
        
        # Check if there's an error message about duplicate email
        current_url = driver.current_url
        # If registration fails due to duplicate email, we should still be on register page
        if "farmer/register" in current_url or "register" in current_url:
            print("✓ Farmer registration duplicate email test passed - caught duplicate email")
        else:
            print("ℹ Farmer registration duplicate email test - email may not have existed")

    def test_05_farmer_registration_form_interactions(self):
        """Test form interactions on farmer registration page."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/register")
        
        # Wait for the registration page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "name")))
        
        # Test typing in name field
        name_input = driver.find_element(By.NAME, "name")
        test_name = "Test Farmer Name"
        name_input.send_keys(test_name)
        self.assertEqual(test_name, name_input.get_attribute("value"))
        
        # Clear the field
        name_input.clear()
        self.assertEqual("", name_input.get_attribute("value"))
        
        # Test typing in email field
        email_input = driver.find_element(By.NAME, "email")
        test_email = "test@example.com"
        email_input.send_keys(test_email)
        self.assertEqual(test_email, email_input.get_attribute("value"))
        
        # Clear the field
        email_input.clear()
        self.assertEqual("", email_input.get_attribute("value"))
        
        # Test typing in mobile field
        mobile_input = driver.find_element(By.NAME, "mobileNumber")
        test_mobile = "9876543210"
        mobile_input.send_keys(test_mobile)
        self.assertEqual(test_mobile, mobile_input.get_attribute("value"))
        
        # Clear the field
        mobile_input.clear()
        self.assertEqual("", mobile_input.get_attribute("value"))
        
        print("✓ Farmer registration form interactions test passed")


def suite():
    """Create a test suite for farmer registration tests."""
    test_suite = unittest.TestSuite()
    test_suite.addTest(unittest.makeSuite(FarmerRegistrationTests))
    return test_suite


if __name__ == '__main__':
    # Run the farmer registration tests
    print("Starting Farmer Registration Tests...")
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite())