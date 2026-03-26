import type { Config } from 'tailwindcss'
import baseConfig from '../config/tailwind/base'

const config: Config = {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
}

export default config
