export async function POST(req) {
  try {
    const { email, password } = await req.json()

    // En développement, appeler le mock API
    // En production, utiliser une authentification réelle
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Authentification échouée' }), {
        status: response.status
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500
    })
  }
}
