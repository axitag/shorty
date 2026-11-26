import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import { MetricCard, EmptyState, ErrorMessage } from '../components/ui'

describe('LandingPage', () => {
  it('renders product name', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getAllByText('Shorty').length).toBeGreaterThan(0)
  })
  it('renders CTA links', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getByText(/Start for free/i)).toBeTruthy()
  })
})

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total clicks" value="1,234" />)
    expect(screen.getByText('Total clicks')).toBeTruthy()
    expect(screen.getByText('1,234')).toBeTruthy()
  })
  it('renders positive change', () => {
    render(<MetricCard label="Clicks" value="100" change={25} />)
    expect(screen.getByText(/25%/)).toBeTruthy()
  })
})

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data yet" description="Create something." />)
    expect(screen.getByText('No data yet')).toBeTruthy()
  })
})

describe('ErrorMessage', () => {
  it('renders error message', () => {
    const err = { message: 'Something went wrong', details: null }
    render(<ErrorMessage error={err} />)
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })
  it('renders nothing without error', () => {
    const { container } = render(<ErrorMessage error={null} />)
    expect(container.firstChild).toBeNull()
  })
})
