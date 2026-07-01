function isWithinSchedule(schedule, now = new Date()) {
  const weekday = now.getDay();
  const todays = schedule.find((s) => s.weekday === weekday);
  if (!todays) return false;

  const [openH, openM] = todays.openTime.split(':').map(Number);
  const [closeH, closeM] = todays.closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

function getEffectiveOpenStatus(kitchen) {
  if (kitchen.isOpenOverride === true) return true;
  if (kitchen.isOpenOverride === false) return false;
  return isWithinSchedule(kitchen.schedule || []);
}

module.exports = { getEffectiveOpenStatus, isWithinSchedule };
