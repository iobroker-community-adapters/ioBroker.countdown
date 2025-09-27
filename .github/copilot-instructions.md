# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

## Countdown Adapter Context

This is the **iobroker.countdown** adapter - a utility adapter that provides countdown functionality for future events within the ioBroker ecosystem.

### Key Features
- **Multiple Time Formats**: Provides countdowns in years, months, days, hours, and minutes
- **Dual Output Formats**: Generates both short and long version strings of countdown data
- **HTML & JSON Output**: Creates formatted HTML and JSON content for easy display in visualizations
- **Dynamic Management**: Allows creation, modification, and deletion of countdowns through adapter configuration
- **Flexible Date Formats**: Configurable date format display (default: DD.MM.YYYY HH:MM)
- **Auto-deletion**: Optional automatic cleanup of expired countdowns

### Primary Use Cases
- Event countdown displays in home automation dashboards
- Time-based automation triggers (when countdown reaches zero)
- Household event tracking (birthdays, anniversaries, holidays)
- Project deadline monitoring
- Maintenance schedule countdowns

### Technical Implementation
- **Base Framework**: Uses @iobroker/adapter-core for ioBroker integration
- **Date Processing**: Leverages moment.js for robust date/time calculations
- **HTML Generation**: Uses tableify for structured HTML table output
- **State Management**: Creates structured state trees under `countdowns.*` and setup states
- **Configuration**: JSON-Config based admin interface with materialize UI

### Key Dependencies & Integration Points
- **moment.js**: All date/time calculations and formatting
- **tableify**: HTML table generation for countdown displays
- **ioBroker State System**: Creates states for JSON/HTML output and individual countdown values
- **Admin Interface**: Provides GUI for countdown management in adapter settings

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Configure your adapter with test data
                        await harness.changeAdapterConfig('adaptername', {
                            native: {
                                // Your test configuration
                                apiKey: 'test-key',
                                interval: 60000,
                            },
                        });

                        // Start the adapter
                        await harness.startAdapter();
                        
                        // Wait for adapter to initialize
                        await wait(2000);

                        // Additional tests can be performed here

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            after(() => {
                if (harness) {
                    return harness.stopAdapter();
                }
            });
        });
    }
});
```

#### Best Practices for Integration Tests:
- Test actual adapter initialization and startup sequence
- Test state creation and value setting
- Test configuration validation
- Test error handling during startup
- Test adapter shutdown and cleanup
- Mock external dependencies when necessary for offline testing

### Countdown-Specific Testing Considerations
- **Date Calculation Testing**: Test various future dates, past dates, and edge cases
- **Format Output Testing**: Verify HTML and JSON outputs are correctly formatted
- **Configuration Testing**: Test adding, modifying, and deleting countdowns
- **State Creation Testing**: Ensure all expected states are created with correct properties
- **Moment.js Integration**: Test different date formats and timezone handling
- **Auto-deletion Testing**: If enabled, test that expired countdowns are properly removed

## Code Patterns

### Adapter Initialization
Use the standard ioBroker adapter pattern:

```javascript
const utils = require('@iobroker/adapter-core');

class CountdownAdapter extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'countdown',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        // Initialization logic
        this.log.info('Countdown adapter started');
        
        // Subscribe to state changes if needed
        this.subscribeStates('*');
    }

    onStateChange(id, state) {
        if (state) {
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            this.log.info(`state ${id} deleted`);
        }
    }

    onUnload(callback) {
        try {
            // Clean up timers and resources
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            callback();
        } catch (e) {
            callback();
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module && module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new CountdownAdapter(options);
} else {
    // otherwise start the instance directly
    new CountdownAdapter();
}
```

### State Management
Always use proper state definitions:

```javascript
await this.setObjectNotExistsAsync('countdown.name.days', {
    type: 'state',
    common: {
        name: 'Days until event',
        type: 'number',
        role: 'value',
        read: true,
        write: false,
        unit: 'days'
    },
    native: {}
});
```

### Error Handling
Implement comprehensive error handling:

```javascript
try {
    const result = await this.someAsyncOperation();
    this.log.debug(`Operation successful: ${result}`);
} catch (error) {
    this.log.error(`Operation failed: ${error.message}`);
    // Don't throw error unless it should stop the adapter
}
```

### Logging Best Practices
Use appropriate log levels:
- `error`: Critical errors that might stop adapter functionality
- `warn`: Important warnings that should be noticed
- `info`: General information about adapter operation
- `debug`: Detailed information for debugging (only visible when debug is enabled)

### Configuration Validation
Validate configuration before use:

```javascript
onReady() {
    if (!this.config.someRequiredSetting) {
        this.log.error('Required configuration missing');
        return;
    }
    
    // Continue with initialization
}
```

## Common Tasks

### Creating States
```javascript
// Create a state with proper definition
await this.setObjectNotExistsAsync('path.to.state', {
    type: 'state',
    common: {
        name: 'Human readable name',
        type: 'string',
        role: 'indicator',
        read: true,
        write: false
    },
    native: {}
});

// Set state value
await this.setStateAsync('path.to.state', 'value', true);
```

### Scheduling Tasks
```javascript
// Use setTimeout for delayed tasks
this.updateTimer = setTimeout(() => {
    this.updateCountdowns();
}, this.config.interval || 60000);

// Clear timer in unload
onUnload(callback) {
    if (this.updateTimer) {
        clearTimeout(this.updateTimer);
    }
    callback();
}
```

### Working with Dates in Countdown Context
```javascript
const moment = require('moment');

// Calculate countdown
const now = moment();
const target = moment(targetDate);
const diff = target.diff(now);

if (diff > 0) {
    const duration = moment.duration(diff);
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    // Create countdown string
    const countdownText = `${days} days, ${hours} hours, ${minutes} minutes`;
} else {
    // Event has passed
    this.log.info('Countdown has expired');
}
```

## JSON-Config Guidelines

### Basic Structure
```json
{
    "type": "panel",
    "items": {
        "interval": {
            "type": "number",
            "label": "Update interval (ms)",
            "min": 1000,
            "max": 86400000,
            "default": 120000
        }
    }
}
```

### Countdown-Specific Configuration
```json
{
    "type": "table",
    "items": [
        {
            "type": "text",
            "attr": "name",
            "label": "Countdown name"
        },
        {
            "type": "datetime",
            "attr": "date",
            "label": "Target date"
        },
        {
            "type": "checkbox",
            "attr": "active",
            "label": "Active"
        }
    ]
}
```

## Performance Considerations

### Efficient State Updates
- Only update states when values actually change
- Use appropriate update intervals (avoid too frequent updates)
- Batch state updates when possible

### Memory Management
- Clean up timers and intervals in `unload()`
- Avoid memory leaks with event listeners
- Use weak references where appropriate

## Security Best Practices

### Input Validation
Always validate user inputs, especially from configuration:

```javascript
if (typeof this.config.interval !== 'number' || this.config.interval < 1000) {
    this.log.warn('Invalid interval configured, using default');
    this.config.interval = 60000;
}
```

### Safe State Operations
```javascript
try {
    await this.setStateAsync(id, value, true);
} catch (error) {
    this.log.error(`Failed to set state ${id}: ${error.message}`);
}
```

## Dependencies Management

### Core Dependencies
- Always use `@iobroker/adapter-core` as the base
- Keep dependencies minimal and up-to-date
- For countdown functionality, moment.js is essential for date calculations

### Version Constraints
- Use specific version ranges in package.json
- Test with minimum supported Node.js version
- Regular dependency updates for security patches

## Debugging Tips

### Common Debug Scenarios
1. **Adapter won't start**: Check configuration validation and required dependencies
2. **States not created**: Verify object definitions and permissions
3. **Values not updating**: Check timer setup and error handling in update loops
4. **Date calculations wrong**: Verify moment.js usage and timezone handling

### Debug Logging
```javascript
this.log.debug(`Processing countdown: ${JSON.stringify(countdown)}`);
this.log.debug(`Calculated difference: ${diff}ms`);
```

### Development Mode
Enable debug logging in development:
```javascript
if (this.log.level === 'debug') {
    // Additional debug information
}
```

## Documentation Requirements

### Code Comments
- Document complex business logic
- Explain non-obvious calculations
- Add JSDoc for public methods

### README Updates
- Update feature descriptions when adding functionality
- Include configuration examples
- Document any breaking changes

### Changelog Maintenance
- Follow semantic versioning
- Document all changes clearly
- Include migration notes for breaking changes

This template provides comprehensive guidance for developing ioBroker adapters with GitHub Copilot assistance, specifically tailored for the countdown adapter's functionality and requirements.