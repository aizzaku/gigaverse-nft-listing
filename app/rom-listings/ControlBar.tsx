'use client'

import { PixelSwitch } from '@gigaverse/ui'
import type { DisplaySettings } from './RomListingsClient'

interface Props {
  settings: DisplaySettings
  onChange: (s: DisplaySettings) => void
}

function BoostSwitch({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <PixelSwitch checked={checked} onCheckedChange={onCheckedChange} />
      <div className="flex flex-col leading-none gap-[3px]">
        <span
          className="font-bitcell text-[13px] uppercase tracking-[1.5px]"
          style={{ color: checked ? '#F5C563' : '#e0e0e0' }}
        >
          {label}
        </span>
        <span
          className="font-bitcell text-[11px] uppercase tracking-[1px]"
          style={{ color: checked ? '#F5C563' : '#7a8a9e' }}
        >
          {description}
        </span>
      </div>
    </label>
  )
}

export function ControlBar({ settings, onChange }: Props) {
  const set = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="flex items-center gap-5">
      <BoostSwitch
        checked={settings.linked}
        onCheckedChange={(v) => set('linked', v)}
        label="Linked"
        description="+60% output"
      />
      <BoostSwitch
        checked={settings.juiced}
        onCheckedChange={(v) => set('juiced', v)}
        label="Juiced"
        description="+20% output"
      />
    </div>
  )
}
