import ky from 'ky'

export const api = ky.create({
  prefixUrl: '/api/v1',
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error
        if (response) {
          const body = await response.json().catch(() => null)
          if (body && typeof body === 'object' && 'error' in body) {
            error.message = (body as { error: { message: string } }).error.message
          }
        }
        return error
      },
    ],
  },
})
