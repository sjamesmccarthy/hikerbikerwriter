"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don&apos;t have permission to access this application
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              This application is restricted to authorized users only.
            </p>

            {email && (
              <div className="bg-gray-100 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-600">
                  The email address{" "}
                  <span className="font-semibold">{email}</span> is not
                  authorized to access this application.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              If you believe you should have access, please contact the
              administrator.
            </p>

            <div className="space-y-3">
              <Link
                href="/api/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Try Different Account
              </Link>

              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccessDenied() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
