import { useState, useCallback, useRef } from "react";
import { api } from "../utils/api.js";
import { formToPayload } from "../utils/event.js";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (start, end) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api(`/api/events?start=${start}&end=${end}`);
      setEvents(payload.events);
      return payload.events;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (formData, eventDate) => {
    const payload = await api("/api/events", {
      method: "POST",
      body: JSON.stringify(formToPayload(formData, eventDate)),
    });
    return payload.event;
  }, []);

  const updateEvent = useCallback(async (id, formData, eventDate) => {
    const payload = await api(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(formToPayload(formData, eventDate)),
    });
    return payload.event;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await api(`/api/events/${id}`, { method: "DELETE" });
  }, []);

  const importFile = useCallback(async (file) => {
    const content = await file.text();
    const payload = await api("/api/import", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, content }),
    });
    return payload;
  }, []);

  return {
    events, setEvents, isLoading, error,
    fetchEvents, createEvent, updateEvent, deleteEvent, importFile,
  };
}
