import '@testing-library/jest-dom'
import * as React from 'react'
// Make React available globally in the jsdom test environment
// so component files using JSX without explicit React imports work correctly
globalThis.React = React
