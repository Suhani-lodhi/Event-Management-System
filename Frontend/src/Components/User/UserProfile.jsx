import useProfile from "../../context/useProfile.jsx";
import {
  Field,
  ProfileHeader,
  ProfileStatus,
  SaveBar,
  Section,
  getInitials,
} from "../Profile/ProfileParts.jsx";
import "../Profile/profile.css";


const PHONE = /^[0-9+\-\s]{7,12}$/;

const toForm = (p) => ({
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  phoneNumber: p.phoneNumber ?? "",
});


const toPayload = (f) => ({
  firstName: f.firstName,
  lastName: f.lastName,
  phoneNumber: f.phoneNumber,
});

const validate = (f) => {
  const errors = {};
  if (!f.firstName.trim()) errors.firstName = "First name is required";
  if (!f.lastName.trim()) errors.lastName = "Last name is required";
  if (f.phoneNumber.trim() && !PHONE.test(f.phoneNumber.trim()))
    errors.phoneNumber = "Enter a valid phone number";
  return errors;
};

export default function ParticipantProfile() {
  const {
    profile,
    form,
    errors,
    editing,
    loading,
    saving,
    loadError,
    reload,
    handleChange,
    startEdit,
    cancelEdit,
    save,
  } = useProfile({ toForm, toPayload, validate });

  if (loading || loadError || !profile) {
    return (
      <div className="pf-page">
        <ProfileStatus loading={loading} error={loadError} onRetry={reload} />
      </div>
    );
  }

  const field = (name) => ({ name, value: form[name], onChange: handleChange, editing, error: errors[name] });
  const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();

  return (
    <>

    <div className="pf-page">
      <ProfileHeader
        initials={getInitials(profile.firstName, profile.lastName)}
        title={fullName}
        subtitle={profile.email}
        badges={[
          { label: "Participant" },
          profile.isEmailVeified
            ? { label: "Email verified", ok: true }
            : { label: "Email not verified" },
        ]}
        editing={editing}
        onEdit={startEdit}
      />

      <form onSubmit={save} noValidate>
        <Section
          title="Your details"
          description="Organizers see your name, email and phone number when you book an event."
        >
          <Field label="First name" autoComplete="given-name" {...field("firstName")} />
          <Field label="Last name" autoComplete="family-name" {...field("lastName")} />
          <Field label="Phone number" type="tel" inputMode="tel" autoComplete="tel" {...field("phoneNumber")} />
          <Field
            label="Email"
            name="email"
            value={profile.email}
            editing={editing}
            readOnly
            hint="Email can't be changed here."
          />
        </Section>

        {editing && <SaveBar saving={saving} onCancel={cancelEdit} />}
      </form>
    </div>

   </>
  );
}