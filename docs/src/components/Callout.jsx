import { $style } from 'aether'

const calloutConfig = {
  info: { icon: 'ℹ️', color: '#569cd6' },
  warning: { icon: '⚠️', color: '#dcdcaa' },
  tip: { icon: '💡', color: '#6a9955' },
  danger: { icon: '🚨', color: '#f14c4c' }
}

export function Callout({ type = 'info', title, children }) {
  const config = calloutConfig[type] || calloutConfig.info

  const s = $style`
    .callout {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      margin: 1.5rem 0;
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      border-left: 4px solid ${config.color};
      box-shadow: var(--shadow-sm);
    }

    .callout-icon {
      font-size: 1.25rem;
      line-height: 1.5;
    }

    .callout-content {
      flex: 1;
      min-width: 0;
    }

    .callout-title {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 700;
      color: ${config.color};
      margin-bottom: 0.5rem;
    }

    .callout-body {
      font-size: 0.9375rem;
      color: var(--color-ink-light);
      line-height: 1.6;
    }

    .callout-body p {
      margin-bottom: 0.5rem;
    }

    .callout-body p:last-child {
      margin-bottom: 0;
    }

    .callout-body code {
      font-size: 0.8125rem;
    }
  `

  return (
    <div class={s.callout}>
      <span class={s.calloutIcon}>{config.icon}</span>
      <div class={s.calloutContent}>
        {title && <p class={s.calloutTitle}>{title}</p>}
        <div class={s.calloutBody}>{children}</div>
      </div>
    </div>
  )
}
