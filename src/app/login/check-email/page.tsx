import Link from 'next/link'

type SearchParams = Promise<{ email?: string }>

export default async function CheckEmailPage(props: {
  searchParams: SearchParams
}) {
  const { email } = await props.searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30">
          <svg
            className="h-8 w-8 text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-white">Sprawdź skrzynkę</h1>

        <p className="mb-2 text-neutral-400">
          Wysłaliśmy link potwierdzający na
        </p>
        {email && (
          <p className="mb-6 text-base font-medium text-orange-400">{email}</p>
        )}

        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left text-sm text-neutral-400">
          <p className="mb-3 font-medium text-neutral-200">Co dalej?</p>
          <ol className="space-y-2">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                1
              </span>
              <span>Otwórz maila od FitMind (sprawdź też folder spam)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                2
              </span>
              <span>Kliknij link potwierdzający</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                3
              </span>
              <span>Wróć tutaj i zaloguj się</span>
            </li>
          </ol>
        </div>

        <p className="text-xs text-neutral-500">
          Nie przyszedł mail w ciągu 2 minut? Sprawdź spam lub{' '}
          <Link
            href="/login?mode=register"
            className="text-orange-400 hover:text-orange-300"
          >
            spróbuj ponownie
          </Link>
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Wróć do logowania
        </Link>
      </div>
    </main>
  )
}
