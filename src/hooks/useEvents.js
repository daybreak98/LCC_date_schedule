import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { formToPayload } from "../utils/event.js";
import { parseImportFile } from "../utils/importParser.js";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (start, end) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", start)
        .lte("event_date", end)
        .order("event_date")
        .order("start_time")
        .order("title");

      if (queryError) throw queryError;
      setEvents(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (formData, eventDate) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...formToPayload(formData, eventDate), user_id: user?.id };
    const { data, error: insertError } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);
    return data;
  }, []);

  const updateEvent = useCallback(async (id, formData, eventDate) => {
    const payload = formToPayload(formData, eventDate);
    const { data, error: updateError } = await supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return data;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (deleteError) throw new Error(deleteError.message);
  }, []);

  const importFile = useCallback(async (file) => {
    const content = await file.text();
    const parsed = parseImportFile(file.name, content);
    if (parsed.length === 0) {
      throw new Error("文件中未找到可导入的日程数据");
    }

    const { data: { user } } = await supabase.auth.getUser();
    const payload = parsed.map((e) => ({ ...e, user_id: user?.id }));

    const { data, error: importError } = await supabase
      .from("events")
      .insert(payload)
      .select();

    if (importError) throw new Error(importError.message);
    return { imported: data.length, events: data };
  }, []);

  return {
    events, setEvents, isLoading, error,
    fetchEvents, createEvent, updateEvent, deleteEvent, importFile,
  };
}
