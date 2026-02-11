# WasteToWealth Selenium Tests

This directory contains Selenium tests for the WasteToWealth application.

## Setup

1. Make sure you have Python installed on your system
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Prerequisites

1. Make sure the WasteToWealth application is running on `http://localhost:8080`
2. Ensure MongoDB is running on the default port

## Running the Tests

### Method 1: Run the test runner script
```
python run_tests.py
```

### Method 2: Run specific test file
```
python improved_selenium_tests.py
```

### Method 3: Run with unittest directly
```
python -m unittest improved_selenium_tests.WasteToWealthTests -v
```

## Test Coverage

The test suite covers:

1. **Home page navigation** - Verifies the home page loads correctly
2. **Farmer registration** - Tests the farmer registration flow
3. **Farmer login** - Tests the farmer login functionality
4. **Company registration** - Tests the company registration flow
5. **Company login** - Tests the company login functionality
6. **Creating farmer listings** - Tests creating new farmer waste listings
7. **Viewing listings** - Tests viewing both farmer and company listings
8. **Logout functionality** - Tests the logout process

## Notes

- The tests assume the application is running on port 8080
- Some tests use randomly generated data to avoid conflicts
- For the tests to pass completely, you may need to set up test accounts in the database
- The tests will automatically download the appropriate ChromeDriver

## Troubleshooting

- If you get a ChromeDriver error, make sure Chrome is installed on your system
- If tests fail due to timeout, try increasing the wait times in the test code
- Make sure the application server is running before executing tests