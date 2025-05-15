export async function refreshAuthToken(): Promise<string | null> {
    try {
        const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: localStorage.getItem('token'),
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.newToken || null;
        } else {
            console.error('Failed to refresh token:', response.statusText);
        }
    } catch (error) {
        console.error('Error during token refresh:', error);
    }

    return null;
}
