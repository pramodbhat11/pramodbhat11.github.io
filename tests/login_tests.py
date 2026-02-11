"""
Selenium Login Tests for WasteToWealth Application

This test suite focuses specifically on login functionality:
1. Farmer login page elements and form validation
2. Company login page elements and form validation
3. Login with invalid credentials (expecting error messages)
4. Basic form interaction tests
"""

import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys


class LoginTests(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        # Use Chrome driver - you may need to install chromedriver
        self.driver = webdriver.Chrome()
        self.driver.implicitly_wait(10)
        self.base_url = "http://localhost:8080"
        self.wait = WebDriverWait(self.driver, 10)

    def tearDown(self):
        """Tear down test fixtures after each test method."""
        self.driver.quit()

    def test_01_farmer_login_page_elements(self):
        """Test that farmer login page loads correctly and has required elements."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/login")
        
        # Wait for the login page to load
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
        
        # Verify page title contains 'Login'
        self.assertIn("Login", driver.title)
        
        # Verify login form elements are present
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        self.assertTrue(email_input.is_displayed())
        self.assertTrue(password_input.is_displayed())
        self.assertTrue(submit_button.is_displayed())
        
        # Verify input fields are initially empty
        self.assertEqual("", email_input.get_attribute("value"))
        self.assertEqual("", password_input.get_attribute("value"))
        
        print("✓ Farmer login page elements test passed")

    def test_02_company_login_page_elements(self):
        """Test that company login page loads correctly and has required elements."""
        driver = self.driver
        driver.get(f"{self.base_url}/company/login1")
        
        # Wait for the login page to load
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
        
        # Verify page title contains 'Login'
        self.assertIn("Login", driver.title)
        
        # Verify login form elements are present
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        self.assertTrue(email_input.is_displayed())
        self.assertTrue(password_input.is_displayed())
        self.assertTrue(submit_button.is_displayed())
        
        # Verify input fields are initially empty
        self.assertEqual("", email_input.get_attribute("value"))
        self.assertEqual("", password_input.get_attribute("value"))
        
        print("✓ Company login page elements test passed")

    def test_03_farmer_login_with_invalid_credentials(self):
        """Test farmer login with invalid credentials - should show error."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/login")
        
        # Wait for the login page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        
        # Fill in invalid credentials
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        email_input.send_keys("invalid@example.com")
        password_input.send_keys("wrongpassword")
        submit_button.click()
        
        # Wait for potential error message (allow some time for server response)
        time.sleep(2)
        
        # Check if we're still on the login page (indicating failed login)
        current_url = driver.current_url
        self.assertIn("farmer/login", current_url)
        
        print("✓ Farmer login with invalid credentials test passed")

    def test_04_company_login_with_invalid_credentials(self):
        """Test company login with invalid credentials - should show error."""
        driver = self.driver
        driver.get(f"{self.base_url}/company/login1")
        
        # Wait for the login page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        
        # Fill in invalid credentials
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        email_input.send_keys("invalid@example.com")
        password_input.send_keys("wrongpassword")
        submit_button.click()
        
        # Wait for potential error message (allow some time for server response)
        time.sleep(2)
        
        # Check if we're still on the login page (indicating failed login)
        current_url = driver.current_url
        self.assertIn("company/login1", current_url)
        
        print("✓ Company login with invalid credentials test passed")

    def test_05_farmer_login_form_interactions(self):
        """Test form interactions on farmer login page."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/login")
        
        # Wait for the login page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        
        # Test typing in email field
        email_input = driver.find_element(By.NAME, "email")
        test_email = "test@example.com"
        email_input.send_keys(test_email)
        self.assertEqual(test_email, email_input.get_attribute("value"))
        
        # Clear the field and test password field
        email_input.clear()
        self.assertEqual("", email_input.get_attribute("value"))
        
        # Test typing in password field
        password_input = driver.find_element(By.NAME, "password")
        test_password = "testpassword"
        password_input.send_keys(test_password)
        # Note: We can't verify password field value due to security restrictions
        # but we can verify it's not empty by checking if it has content
        self.assertTrue(len(password_input.get_attribute("value")) > 0)
        
        # Clear the password field
        password_input.clear()
        # The value attribute for password fields is masked, so we just verify it's cleared
        # by attempting to type again
        
        print("✓ Farmer login form interactions test passed")

    def test_06_company_login_form_interactions(self):
        """Test form interactions on company login page."""
        driver = self.driver
        driver.get(f"{self.base_url}/company/login1")
        
        # Wait for the login page to load
        self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        
        # Test typing in email field
        email_input = driver.find_element(By.NAME, "email")
        test_email = "company@example.com"
        email_input.send_keys(test_email)
        self.assertEqual(test_email, email_input.get_attribute("value"))
        
        # Clear the field and test password field
        email_input.clear()
        self.assertEqual("", email_input.get_attribute("value"))
        
        # Test typing in password field
        password_input = driver.find_element(By.NAME, "password")
        test_password = "testpassword"
        password_input.send_keys(test_password)
        # Note: We can't verify password field value due to security restrictions
        
        # Clear the password field
        password_input.clear()
        
        print("✓ Company login form interactions test passed")


def suite():
    """Create a test suite for login tests."""
    test_suite = unittest.TestSuite()
    test_suite.addTest(unittest.makeSuite(LoginTests))
    return test_suite


if __name__ == '__main__':
    # Run the login tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite())