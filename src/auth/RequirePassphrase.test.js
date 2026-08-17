import React from 'react';
import { render, screen } from '@testing-library/react';
import RequirePassphrase from './RequirePassphrase';
import usePassphraseStore from './passphrase/store';

vi.mock('./passphrase/store');

const mockStore = (state) => {
  usePassphraseStore.mockImplementation((selector) =>
    selector({
      checking: false,
      authed: false,
      error: null,
      apiMissing: false,
      check: vi.fn(),
      login: vi.fn(),
      ...state,
    })
  );
};

describe('RequirePassphrase', () => {
  it('hides children while the session is still being checked', () => {
    mockStore({ checking: true });
    render(
      <RequirePassphrase label="Route /major · private">
        <p>secret</p>
      </RequirePassphrase>
    );
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Passphrase')).not.toBeInTheDocument();
  });

  it('shows the gate when the check finished and no session exists', () => {
    mockStore({ checking: false, authed: false });
    render(
      <RequirePassphrase label="Route /major · private">
        <p>secret</p>
      </RequirePassphrase>
    );
    expect(screen.getByLabelText('Passphrase')).toBeInTheDocument();
    expect(screen.getByText('Route /major · private')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('explains the missing backend instead of showing an unopenable gate', () => {
    mockStore({ checking: false, apiMissing: true });
    render(
      <RequirePassphrase label="Route /major · private" route="/major">
        <p>secret</p>
      </RequirePassphrase>
    );
    expect(screen.getByText(/vercel dev/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Passphrase')).not.toBeInTheDocument();
  });

  it('renders children once authenticated', () => {
    mockStore({ checking: false, authed: true });
    render(
      <RequirePassphrase label="Route /major · private">
        <p>secret</p>
      </RequirePassphrase>
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});
