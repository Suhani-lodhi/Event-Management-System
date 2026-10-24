import useProfile from "../../context/useProfile.jsx";
import {
  Field,
  ProfileHeader,
  ProfileStatus,
  SaveBar,
  Section,
  getInitials,
} from "../../Components/Profile/ProfileParts.jsx"
import "../../Components/Profile/profile.css";

const PHONE = /^[0-9+\-\s]{7,15}$/;

const REQUIRED = {
  firstName: "First name",
  lastName: "Last name",
  displayName: "Display name",
  companyName: "Company name",
  addressLine1: "Address",
  city: "City",
  state: "State",
  country: "Country",
};

const toForm = (p) => {
  const o = p.organizer || {};
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    phoneNumber: p.phoneNumber ?? "",
    displayName: o.displayName ?? "",
    companyName: o.companyName ?? "",
    alternatePhoneNumber: o.alternatePhoneNumber ?? "",
    addressLine1: o.addressLine1 ?? "",
    city: o.city ?? "",
    state: o.state ?? "",
    country: o.country ?? "",
    pincode: o.pincode != null ? String(o.pincode) : "",
  };
};

// Organizer fields are nested under `organizer`, matching validateProfile on the backend.
// pincode must be a number: the backend rejects strings.
const toPayload = (f) => ({
  firstName: f.firstName,
  lastName: f.lastName,
  phoneNumber: f.phoneNumber,
  organizer: {
    displayName: f.displayName,
    companyName: f.companyName,
    alternatePhoneNumber: f.alternatePhoneNumber,
    addressLine1: f.addressLine1,
    city: f.city,
    state: f.state,
    country: f.country,
    pincode: Number(f.pincode),
  },
});

const validate = (f) => {
  const errors = {};
  for (const [key, label] of Object.entries(REQUIRED)) {
    if (!f[key].trim()) errors[key] = `${label} is required`;
  }
  if (f.phoneNumber.trim() && !PHONE.test(f.phoneNumber.trim()))
    errors.phoneNumber = "Enter a valid phone number";
  if (f.alternatePhoneNumber.trim() && !PHONE.test(f.alternatePhoneNumber.trim()))
    errors.alternatePhoneNumber = "Enter a valid phone number";
  if (!f.pincode.trim()) errors.pincode = "Pincode is required";
  else if (!/^\d{4,10}$/.test(f.pincode.trim())) errors.pincode = "Pincode must be numbers only";
  return errors;
};

export default function OrganizerProfile() {
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
    <div className="pf-page">
      <ProfileHeader
        initials={getInitials(profile.firstName, profile.lastName)}
        title={profile.organizer?.displayName || fullName}
        subtitle={profile.organizer?.companyName}
        badges={[
          { label: "Organizer" },
          profile.isEmailVeified
            ? { label: "Email verified", ok: true }
            : { label: "Email not verified" },
        ]}
        editing={editing}
        onEdit={startEdit}
      />

      <form onSubmit={save} noValidate>
        <Section title="Personal details" description="The person managing this organizer account.">
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

        <Section
          title="Organization"
          description="Attendees see your display name on your events."
        >
          <Field label="Display name" {...field("displayName")} />
          <Field label="Company name" {...field("companyName")} />
        </Section>

        <Section title="Address and contact" description="Where your organization is based.">
          <Field label="Address" full autoComplete="address-line1" {...field("addressLine1")} />
          <Field label="City" autoComplete="address-level2" {...field("city")} />
          <Field label="State" autoComplete="address-level1" {...field("state")} />
          <Field label="Country" autoComplete="country-name" {...field("country")} />
          <Field label="Pincode" inputMode="numeric" autoComplete="postal-code" {...field("pincode")} />
          <Field
            label="Alternate phone number"
            type="tel"
            inputMode="tel"
            {...field("alternatePhoneNumber")}
          />
        </Section>

        {editing && <SaveBar saving={saving} onCancel={cancelEdit} />}
      </form>
    </div>
  );
}