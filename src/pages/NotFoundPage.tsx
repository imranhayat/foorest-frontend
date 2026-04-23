import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand">404</p>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <Link to="/" className="mt-6 inline-block text-sm text-brand hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
