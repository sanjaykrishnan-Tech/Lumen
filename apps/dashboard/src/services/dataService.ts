import type { DataService } from '@lumen/shared-types'
import { apiDataService } from './apiDataService'
import { dataService as mockDataService } from './mockDataService'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const dataService: DataService = useMock ? mockDataService : apiDataService
