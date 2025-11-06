#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class TestRunner {
  constructor() {
    this.tests = []
    this.passed = 0
    this.failed = 0
    this.errors = []
  }

  describe(name, fn) {
    console.log(`\n📋 ${name}`)
    fn()
  }

  test(name, fn) {
    try {
      fn()
      console.log(`  ✅ ${name}`)
      this.passed++
    } catch (error) {
      console.log(`  ❌ ${name}`)
      console.log(`     ${error.message}`)
      this.failed++
      this.errors.push({ name, error: error.message })
    }
  }

  async testAsync(name, fn) {
    try {
      await fn()
      console.log(`  ✅ ${name}`)
      this.passed++
    } catch (error) {
      console.log(`  ❌ ${name}`)
      console.log(`     ${error.message}`)
      this.failed++
      this.errors.push({ name, error: error.message })
    }
  }

  expect(value) {
    return {
      toBe: (expected) => {
        if (value !== expected) {
          throw new Error(`Expected ${expected}, but got ${value}`)
        }
      },
      toBeDefined: () => {
        if (value === undefined || value === null) {
          throw new Error(`Expected value to be defined, but got ${value}`)
        }
      },
      toContain: (expected) => {
        if (!value || !value.includes(expected)) {
          throw new Error(`Expected ${value} to contain ${expected}`)
        }
      }
    }
  }

  run() {
    console.log('🚀 Running AgentFlowOS Integration Tests')
    console.log('=' .repeat(50))

    // Load and run test files
    const testDir = path.join(__dirname, 'tests')
    const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'))

    for (const testFile of testFiles) {
      console.log(`\n📁 Running ${testFile}`)
      try {
        const testModule = require(path.join(testDir, testFile))
        // Tests are run during module loading
      } catch (error) {
        console.error(`💥 Failed to load ${testFile}: ${error.message}`)
        this.failed++
      }
    }

    this.printSummary()
  }

  printSummary() {
    console.log('\n' + '=' .repeat(50))
    console.log('📊 Test Results Summary')
    console.log('=' .repeat(50))
    console.log(`✅ Passed: ${this.passed}`)
    console.log(`❌ Failed: ${this.failed}`)
    console.log(`📈 Total: ${this.passed + this.failed}`)

    if (this.failed > 0) {
      console.log('\n💥 Failed Tests:')
      this.errors.forEach(({ name, error }) => {
        console.log(`  • ${name}: ${error}`)
      })
    }

    const success = this.failed === 0
    console.log(`\n${success ? '🎉' : '💥'} ${success ? 'All tests passed!' : 'Some tests failed!'}`)

    process.exit(success ? 0 : 1)
  }
}

// Mock implementations for testing
global.describe = function(name, fn) {
  if (!global.testRunner) {
    global.testRunner = new TestRunner()
  }
  global.testRunner.describe(name, fn)
}

global.test = function(name, fn) {
  if (!global.testRunner) {
    global.testRunner = new TestRunner()
  }
  global.testRunner.test(name, fn)
}

global.expect = function(value) {
  if (!global.testRunner) {
    global.testRunner = new TestRunner()
  }
  return global.testRunner.expect(value)
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testRunner = new TestRunner()
  global.testRunner = testRunner
  testRunner.run()
}

module.exports = TestRunner