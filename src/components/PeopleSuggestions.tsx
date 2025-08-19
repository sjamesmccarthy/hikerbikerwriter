import React, { useEffect, useState } from "react";

interface PersonSuggestion {
  name: string;
  email: string;
  person_id: string;
}

interface PeopleSuggestionsProps {
  readonly userEmail: string;
  readonly familylineId: string | null;
  readonly existingFamilyEmails?: string[];
  readonly userPersonId?: string | null;
}

export function PeopleSuggestions({
  userEmail,
  familylineId,
  existingFamilyEmails = [],
  userPersonId,
}: PeopleSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSuggestions() {
      if (!familylineId || !userEmail) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/people-suggestions?email=${encodeURIComponent(
            userEmail
          )}&familylineId=${encodeURIComponent(familylineId)}`
        );

        if (!mounted) return;

        const data = await res.json();

        if (res.ok) {
          // Filter out any suggestions that are already in the family and the logged-in user
          const filteredSuggestions = data.filter(
            (suggestion: PersonSuggestion) =>
              !existingFamilyEmails.includes(suggestion.email) &&
              suggestion.person_id !== userPersonId
          );
          setSuggestions(filteredSuggestions);
        } else {
          console.error("People suggestions API error:", data.error);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      mounted = false;
    };
  }, [familylineId, userEmail, existingFamilyEmails, userPersonId]);

  if (loading) {
    return (
      <div className="pt-4 pl-8">
        <div className="text-sm text-gray-500">Loading suggestions...</div>
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="pt-4 pl-8">
        <div className="text-sm text-gray-500">
          No suggestions available at this time.
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pl-8">
      <div className="text-sm font-medium text-gray-700 mb-2">
        People you may know based on your family connections:
      </div>
      <ul className="pl-8 text-sm list-disc space-y-2">
        {suggestions.map((person) => (
          <li key={person.person_id} className="text-gray-600">
            {person.name} ({person.email}) - ({person.person_id})
          </li>
        ))}
      </ul>
    </div>
  );
}
