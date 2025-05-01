# GoHighLevel Performance Testing Suite

This project contains performance tests for the GoHighLevel application using k6, a modern load testing tool that makes performance testing easy and productive.

## Overview

The test suite simulates user interactions with the GoHighLevel platform, including:

- Homepage access
- User authentication
- Dashboard navigation
- Contact management operations (search, create, update, delete)
- API performance validation

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed on your machine
- Node.js (for managing test data)
- Access to GoHighLevel platform
- Valid login credentials

## Project Structure

```
├── go.highlevel.js     # Main test script with test scenarios
├── commons.js          # Common utilities and header configurations
├── loginData.csv       # Test user credentials
└── contacts.csv        # Test contact data
```

## Configuration

### Test Data Setup

1. `loginData.csv`: Contains login credentials in the format:
   ```
   email,password
   ```

2. `contacts.csv`: Contains test contact data in the format:
   ```
   firstName,lastName,email
   ```

### Performance Thresholds

The test suite enforces the following performance requirements:

- Global Requirements:
  - Error rate < 2%
  - 95% of requests complete within 800ms

- Specific API Endpoints:
  - `/campaigns` and `/messages/send`: Response time < 500ms for 95% of requests
  - All critical endpoints maintain 98% success rate

## Test Scenarios

The test script includes the following scenarios:

1. Homepage Access
2. User Authentication
3. Dashboard Navigation
4. Contact Management:
   - Contact Search
   - Contact Creation
   - Contact Update
   - Bulk Contact Deletion

## Load Profile

The test executes with the following load pattern:

- Ramp-up: 0 to 200 virtual users over 3 minutes
- Steady state: 200 virtual users for 12 minutes
- Graceful ramp-down: 30 seconds

## Running the Tests

To run the performance tests:

```bash
k6 run go.highlevel.js
```

## Test Results

The test will fail if any of these conditions are met:
- Average response time > 800ms
- API error rate > 2%
- Critical endpoint success rate < 98%
- Campaign/message endpoints response time > 500ms

## Monitoring

The test outputs detailed logs for each request, including:
- Response times
- Status codes
- Error rates
- Success/failure checks

## Best Practices

1. Run tests in a controlled environment
2. Use realistic test data
3. Monitor system resources during test execution
4. Review test results thoroughly before making performance optimizations

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is proprietary and confidential. All rights reserved.