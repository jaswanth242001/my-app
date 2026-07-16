import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const { user, fetchProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const knownFields = ["firstName", "lastName", "email"];
  const extraFields = profile
    ? Object.entries(profile).filter(([key]) => !knownFields.includes(key))
    : [];

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>Your profile</h1>
        {loading && <p>Loading profile...</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && profile && (
          <>
            <div className="profile-avatar">
              {(fullName || profile.email || "?").charAt(0).toUpperCase()}
            </div>
            {fullName && <p className="profile-name">{fullName}</p>}
            {profile.email && <p className="profile-email">{profile.email}</p>}
            {extraFields.length > 0 && (
              <dl className="profile-extra">
                {extraFields.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
