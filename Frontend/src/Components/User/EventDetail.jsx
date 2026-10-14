import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventDetailsForUser } from "../../api/UserApi/event";
import { getImageSrc } from "../../utils/imageUrl";
import "./styles/ParticipantEventDetails.css";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRegistrationState(session, eventStatus) {
  const now = new Date();
  const regStart = new Date(session.regStartdateTime);
  const regEnd = new Date(session.regEndDateTime);

  if (eventStatus === "CLOSED") {
    return { state: "closed", label: "Registration closed" };
  }
  if (now < regStart) {
    return { state: "upcoming", label: `Registration opens ${formatDate(regStart)}` };
  }
  if (now > regEnd || session.registrationStatus === "CLOSED") {
    return { state: "closed", label: "Registration closed" };
  }
  return { state: "open", label: `Register by ${formatDate(regEnd)}` };
}

