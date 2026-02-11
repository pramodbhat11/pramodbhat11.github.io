"""
Test runner script for WasteToWealth Selenium tests
"""
import unittest
import sys
import os

# Add the tests directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_all_tests():
    """Run all selenium tests."""
    # Discover and run all tests in the current directory
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(os.path.abspath(__file__))
    suite = loader.discover(start_dir, pattern='*_tests.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result

if __name__ == '__main__':
    print("Starting WasteToWealth Selenium Tests...")
    print("="*50)
    
    result = run_all_tests()
    
    print("="*50)
    print("Test Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors))/result.testsRun)*100:.2f}%" if result.testsRun > 0 else "0%")
    
    if result.failures:
        print("\nFailures:")
        for test, traceback in result.failures:
            print(f"  {test}: {traceback}")
    
    if result.errors:
        print("\nErrors:")
        for test, traceback in result.errors:
            print(f"  {test}: {traceback}")