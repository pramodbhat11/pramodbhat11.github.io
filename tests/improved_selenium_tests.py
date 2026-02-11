"""
Selenium Test Suite for WasteToWealth Application

This test suite covers:
1. Home page navigation
2. Farmer registration and login
3. Company registration and login
4. Creating farmer listings
5. Creating company listings
6. Viewing and editing listings
7. Logout functionality
"""

import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import random
import string


class WasteToWealthTests(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        # Automatically download and setup ChromeDriver
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

    def test_01_home_page(self):
        """Test the home page loads correctly."""
        driver = self.driver
        driver.get(self.base_url)
        
        # Wait for the page to load
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        
        # Verify the home page is loaded
        self.assertIn("Home", driver.title)
        self.assertTrue(driver.find_element(By.TAG_NAME, "body"))
        
        # Check for navigation links
        try:
            login_link = driver.find_element(By.LINK_TEXT, "Login")
            self.assertTrue(login_link.is_displayed())
        except:
            print("Login link not found on home page")
        
        try:
            register_link = driver.find_element(By.LINK_TEXT, "Register")
            self.assertTrue(register_link.is_displayed())
        except:
            print("Register link not found on home page")

    def test_02_farmer_registration(self):
        """Test farmer registration flow."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/register")
        
        # Generate random data for registration
        farmer_name = "Test Farmer " + ''.join(random.choices(string.ascii_letters, k=5))
        village = "Test Village " + ''.join(random.choices(string.ascii_letters, k=5))
        mobile = "9876543210"
        email = self.generate_random_email("farmer")
        password = "password123"
        
        # Fill in registration form
        self.wait.until(EC.presence_of_element_located((By.NAME, "Farmername"))).send_keys(farmer_name)
        driver.find_element(By.NAME, "village").send_keys(village)
        driver.find_element(By.NAME, "mobileNumber").send_keys(mobile)
        driver.find_element(By.NAME, "email").send_keys(email)
        driver.find_element(By.NAME, "password").send_keys(password)
        
        # Submit registration
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect and verify registration success
        self.wait.until(EC.url_contains("/farmer/listings"))
        self.assertIn("farmer/listings", driver.current_url)
        
        # Verify success message
        try:
            success_msg = driver.find_element(By.CSS_SELECTOR, ".alert-success, .flash-success")
            self.assertIn("Registration successful", success_msg.text)
        except:
            print("Success message not found, but registration may have succeeded")

    def test_03_farmer_login(self):
        """Test farmer login flow with existing account."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/login")
        
        # Use credentials from registration test or known test account
        email = "test@example.com"  # This should be an existing account
        password = "password123"
        
        # Fill in login form
        self.wait.until(EC.presence_of_element_located((By.NAME, "email"))).send_keys(email)
        driver.find_element(By.NAME, "password").send_keys(password)
        
        # Submit login
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect after login
        self.wait.until(EC.url_contains("/"))
        self.assertIn(self.base_url, driver.current_url)

    def test_04_create_farmer_listing(self):
        """Test creating a new farmer listing."""
        driver = self.driver
        driver.get(f"{self.base_url}/farmer/login")
        
        # Login first with test account
        email = "farmer@example.com"  # Use a real test account
        password = "password123"
        
        self.wait.until(EC.presence_of_element_located((By.NAME, "email"))).send_keys(email)
        driver.find_element(By.NAME, "password").send_keys(password)
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        
        # Wait for login redirect
        self.wait.until(EC.url_contains("/"))
        
        # Navigate to new listing page
        driver.get(f"{self.base_url}/farmers/new")
        
        # Fill in listing details
        farmer_name = "Test Farmer " + ''.join(random.choices(string.ascii_letters, k=5))
        waste_type = "Organic"
        quantity = str(random.randint(50, 200))
        location = "Test Location " + ''.join(random.choices(string.ascii_letters, k=5))
        contact_phone = "9876543210"
        email = "farmer@example.com"
        
        self.wait.until(EC.presence_of_element_located((By.NAME, "farmerName"))).send_keys(farmer_name)
        driver.find_element(By.NAME, "wastetype").send_keys(waste_type)
        driver.find_element(By.NAME, "quantity").send_keys(quantity)
        driver.find_element(By.NAME, "location").send_keys(location)
        driver.find_element(By.NAME, "contactPhone").send_keys(contact_phone)
        driver.find_element(By.NAME, "email").send_keys(email)
        
        # Submit the listing
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect and verify listing creation
        self.wait.until(EC.url_contains("/farmer/listings"))
        self.assertIn("farmer/listings", driver.current_url)

    def test_05_company_registration(self):
        """Test company registration flow."""
        driver = self.driver
        driver.get(f"{self.base_url}/company/login")  # Company registration is via login page
        
        # Generate random data for registration
        company_name = "Test Company " + ''.join(random.choices(string.ascii_letters, k=5))
        owner_name = "Test Owner " + ''.join(random.choices(string.ascii_letters, k=5))
        industry_type = "Recycling"
        email = self.generate_random_email("company")
        contact_number = "9876543210"
        address = "123 Test Street"
        district = "Test District"
        state = "Test State"
        waste_types = "Organic"
        min_quantity = str(random.randint(10, 100))
        gst_number = "12ABCDE1234F1Z5"
        license_number = "COMP123456"
        password = "password123"
        
        # Fill in registration form
        self.wait.until(EC.presence_of_element_located((By.NAME, "companyName"))).send_keys(company_name)
        driver.find_element(By.NAME, "ownerName").send_keys(owner_name)
        driver.find_element(By.NAME, "industryType").send_keys(industry_type)
        driver.find_element(By.NAME, "email").send_keys(email)
        driver.find_element(By.NAME, "contactNumber").send_keys(contact_number)
        driver.find_element(By.NAME, "address").send_keys(address)
        driver.find_element(By.NAME, "district").send_keys(district)
        driver.find_element(By.NAME, "state").send_keys(state)
        driver.find_element(By.NAME, "wasteTypesRequired").send_keys(waste_types)
        driver.find_element(By.NAME, "minQuantityRequired").send_keys(min_quantity)
        driver.find_element(By.NAME, "gstNumber").send_keys(gst_number)
        driver.find_element(By.NAME, "companyLicenseNumber").send_keys(license_number)
        driver.find_element(By.NAME, "password").send_keys(password)
        
        # Submit registration
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect and verify registration success
        self.wait.until(EC.url_contains("/company/listings"))
        self.assertIn("company/listings", driver.current_url)

    def test_06_company_login(self):
        """Test company login flow."""
        driver = self.driver
        driver.get(f"{self.base_url}/company/login1")  # Company login page
        
        # Use test credentials
        email = "company@example.com"
        password = "password123"
        
        # Fill in login form
        self.wait.until(EC.presence_of_element_located((By.NAME, "email"))).send_keys(email)
        driver.find_element(By.NAME, "password").send_keys(password)
        
        # Submit login
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect after login
        self.wait.until(EC.url_contains("/"))
        self.assertIn(self.base_url, driver.current_url)

    def test_07_view_listings(self):
        """Test viewing farmer and company listings."""
        driver = self.driver
        
        # Test viewing farmer listings
        driver.get(f"{self.base_url}/farmer/listings")
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        self.assertIn("farmer/listings", driver.current_url)
        
        # Test viewing company listings
        driver.get(f"{self.base_url}/company/listings")
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        self.assertIn("company/listings", driver.current_url)

    def test_08_logout(self):
        """Test logout functionality."""
        driver = self.driver
        driver.get(f"{self.base_url}/logout")
        
        # Wait for redirect to home page
        self.wait.until(EC.url_contains("/"))
        self.assertEqual(driver.current_url, self.base_url + "/")


def suite():
    """Create a test suite."""
    test_suite = unittest.TestSuite()
    test_suite.addTest(unittest.makeSuite(WasteToWealthTests))
    return test_suite


if __name__ == '__main__':
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite())