"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "next/navigation";

function SignUpForm() {
  const searchParams = useSearchParams();
  const emailFromParams = searchParams?.get("email") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: emailFromParams,
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith("@gmail.com");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    // Validate form
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setMessage({ type: "error", text: "Email is required" });
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setMessage({
        type: "error",
        text: "For now, e-mail must be a gmail address (@gmail.com)",
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setMessage({
        type: "error",
        text: "You must agree to the Terms and Conditions",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const personId = uuidv4();
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          person_id: personId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Signup request submitted successfully! You will receive an email confirmation once your access is approved.",
        });
        setFormData({ name: "", email: "", agreeToTerms: false });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <Image
              src="/images/hikerbikerwriter.png"
              alt="HikerBikerWriter Logo"
              width={200}
              height={100}
              className="w-1/2 h-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Request Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Submit your information to request access to the application
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="youremail@gmail.com"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only Gmail addresses are accepted
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-700">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-500"
                    target="_blank"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-500"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            {message.text && (
              <div
                className={`p-4 rounded-md ${
                  message.type === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className={`h-5 w-5 ${
                        message.type === "error"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {message.type === "error" ? (
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      ) : (
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm ${
                        message.type === "error"
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Request Access"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have access?{" "}
            <Link
              href="/auth/signin"
              className="text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            ← Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
