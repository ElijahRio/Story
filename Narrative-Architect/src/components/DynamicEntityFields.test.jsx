import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DynamicEntityFields from './DynamicEntityFields';

describe('DynamicEntityFields', () => {
  const mockHandleUpdateEntity = jest.fn();
  const mockGetDetectedLinks = jest.fn().mockReturnValue([]);
  const mockSetSelectedId = jest.fn();
  const mockHandleProfileAudit = jest.fn();

  const defaultProps = {
    handleUpdateEntity: mockHandleUpdateEntity,
    getDetectedLinks: mockGetDetectedLinks,
    setSelectedId: mockSetSelectedId,
    handleProfileAudit: mockHandleProfileAudit,
    isAuditingProfile: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders null when no selectedEntity is provided', () => {
    const { container } = render(<DynamicEntityFields {...defaultProps} selectedEntity={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders null for an unknown entity type', () => {
    const entity = { id: '1', type: 'unknown_type' };
    const { container } = render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);
    expect(container.firstChild).toBeNull();
  });

  describe('Asset / Personnel Fields', () => {
    test('renders specific fields for asset type', () => {
      const entity = { id: '1', type: 'asset', name: 'Asset 1' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      expect(screen.getByLabelText(/Birth \/ Assembly Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Death \/ Expiration Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Biological Alterations & Implants/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Compliance Metric/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Degradation Status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Behavioral Profile Audit/i)).toBeInTheDocument();

      // Should not render personnel specific fields
      expect(screen.queryByLabelText(/Psychological Attributes/i)).not.toBeInTheDocument();
    });

    test('renders specific fields for personnel type', () => {
      const entity = { id: '1', type: 'personnel', name: 'Personnel 1' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      expect(screen.getByLabelText(/Birth \/ Assembly Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Death \/ Expiration Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Psychological Attributes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ulterior Motives/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Liabilities \/ Vulnerabilities/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Behavioral Profile Audit/i)).toBeInTheDocument();

      // Should not render asset specific fields
      expect(screen.queryByLabelText(/Biological Alterations & Implants/i)).not.toBeInTheDocument();
    });

    test('triggers handleProfileAudit on Generate Report button click', async () => {
      const entity = { id: '1', type: 'asset' };
      const user = userEvent.setup();
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      const button = screen.getByRole('button', { name: /Generate Report/i });
      await user.click(button);

      expect(mockHandleProfileAudit).toHaveBeenCalledTimes(1);
      expect(mockHandleProfileAudit).toHaveBeenCalledWith(entity);
    });

    test('disables Generate Report button when isAuditingProfile is true', () => {
      const entity = { id: '1', type: 'asset' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} isAuditingProfile={true} />);

      const button = screen.getByRole('button', { name: /Analyzing Timeline/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Technology Fields', () => {
    test('renders specific fields for technology type', () => {
      const entity = { id: '1', type: 'technology' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      expect(screen.getByLabelText(/Biological Cost \/ Side Effects/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Deployment Status/i)).toBeInTheDocument();
    });
  });

  describe('Anomaly Fields', () => {
    test('renders specific fields for anomaly type', () => {
      const entity = { id: '1', type: 'anomaly' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      expect(screen.getByLabelText(/Manifestation Parameters/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Environmental \/ Subject Impact/i)).toBeInTheDocument();
    });
  });

  describe('Event Fields', () => {
    test('renders specific fields for event type', () => {
      const entity = { id: '1', type: 'event' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      expect(screen.getByLabelText(/Numeric Sequence \(Order\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/In-Universe Timestamp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Involved Records/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Systemic Impact/i)).toBeInTheDocument();
    });
  });

  describe('Memory Fields', () => {
    test('renders specific fields for memory type', () => {
      const entity = { id: '1', type: 'memory' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      expect(screen.getByLabelText(/Archival Timestamp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Unresolved Threads \/ Overseer Notes/i)).toBeInTheDocument();
    });
  });

  describe('Interactive Events', () => {
    test('triggers handleUpdateEntity when input values change', async () => {
      const entity = { id: '1', type: 'event', sequence_number: '10' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      const sequenceInput = screen.getByLabelText(/Numeric Sequence \(Order\)/i);

      fireEvent.change(sequenceInput, { target: { value: '20' } });

      expect(mockHandleUpdateEntity).toHaveBeenCalledWith('sequence_number', '20');
    });

    test('triggers handleUpdateEntity when textarea values change', async () => {
      const entity = { id: '1', type: 'event', systemic_impact: 'Old Impact' };
      render(<DynamicEntityFields {...defaultProps} selectedEntity={entity} />);

      const impactTextarea = screen.getByLabelText(/Systemic Impact/i);

      fireEvent.change(impactTextarea, { target: { value: 'New Impact' } });

      expect(mockHandleUpdateEntity).toHaveBeenCalledWith('systemic_impact', 'New Impact');
    });
  });
});
