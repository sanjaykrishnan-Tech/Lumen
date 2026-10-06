import type { DataService } from '@lumen/shared-types'
import { apiDataService } from './apiDataService'
import { dataService as mockDataService } from './mockDataService'

import { USE_MOCK } from './http'

export const dataService: DataService = USE_MOCK ? mockDataService : apiDataService
