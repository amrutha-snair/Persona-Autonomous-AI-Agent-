import config from './config.js';

const headers = {
  'Authorization': `Bearer ${config.calApiKey}`,
  'Content-Type': 'application/json',
  'cal-api-version': config.calApiVersion,
};

export async function getAvailableSlots(startDate, endDate) {
  if (!config.calApiKey) {
    return { slots: [], message: 'Calendar not configured. Please ask Amrutha to set up Cal.com.' };
  }

  try {
    const url = new URL(`${config.calBaseUrl}/slots/available`);
    url.searchParams.append('startTime', startDate);
    url.searchParams.append('endTime', endDate);
    url.searchParams.append('eventTypeId', config.calEventTypeId);

    const res = await fetch(url.toString(), { method: 'GET', headers });
    const data = await res.json();

    if (!res.ok) {
      console.error('Cal.com slots error:', data);
      return { slots: [], message: 'Could not fetch availability. Calendar service may be temporarily unavailable.' };
    }

    const slots = [];
    if (data.data?.slots) {
      for (const [date, dateSlots] of Object.entries(data.data.slots)) {
        for (const slot of dateSlots) {
          slots.push({
            start: slot.time,
            date: date,
          });
        }
      }
    }

    return { slots, message: slots.length > 0 ? `Found ${slots.length} available slots.` : 'No available slots in this range.' };
  } catch (err) {
    console.error('Calendar error:', err.message);
    return { slots: [], message: 'Calendar service error. Please try again.' };
  }
}

export async function bookMeeting(startTime, name, email, notes = '') {
  if (!config.calApiKey) {
    return { success: false, message: 'Calendar not configured.' };
  }

  try {
    const res = await fetch(`${config.calBaseUrl}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventTypeId: parseInt(config.calEventTypeId),
        start: startTime,
        attendee: {
          name: name,
          email: email,
          timeZone: 'Asia/Kolkata',
        },
        metadata: { notes },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Cal.com booking error:', data);
      return { success: false, message: 'Could not book the meeting. Please try a different time.' };
    }

    return {
      success: true,
      message: `Meeting booked successfully! You'll receive a confirmation email at ${email}.`,
      booking: {
        id: data.data?.id,
        start: data.data?.start,
        end: data.data?.end,
      },
    };
  } catch (err) {
    console.error('Booking error:', err.message);
    return { success: false, message: 'Booking failed. Please try again.' };
  }
}
