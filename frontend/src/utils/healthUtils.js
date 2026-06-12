/**
 * Health utility functions for iHealth frontend.
 */

export const getStatusColor = (status) => {
  switch (status) {
    case 'green':  return 'text-healthy'
    case 'yellow': return 'text-warning'
    case 'red':    return 'text-emergency'
    default:       return 'text-gray-500'
  }
}

export const getStatusBg = (status) => {
  switch (status) {
    case 'green':  return 'bg-green-50 dark:bg-green-900/20 border-green-200'
    case 'yellow': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'
    case 'red':    return 'bg-red-50 dark:bg-red-900/20 border-red-200'
    default:       return 'bg-gray-50 border-gray-200'
  }
}

export const getStatusLabel = (status) => {
  switch (status) {
    case 'green':  return 'Healthy'
    case 'yellow': return 'Warning'
    case 'red':    return 'Emergency'
    default:       return 'Unknown'
  }
}

export const getStatusEmoji = (status) => {
  switch (status) {
    case 'green':  return '🟢'
    case 'yellow': return '🟡'
    case 'red':    return '🔴'
    default:       return '⚪'
  }
}

export const getCardBorder = (status) => {
  switch (status) {
    case 'green':  return 'border-green-300 glow-green'
    case 'yellow': return 'border-amber-300 glow-yellow'
    case 'red':    return 'border-red-400 glow-red'
    default:       return 'border-border-light dark:border-border-dark'
  }
}

export const isNormalPulse = (v) => v >= 60 && v <= 100
export const isNormalSpo2  = (v) => v >= 95
export const isNormalTemp  = (v) => v >= 97 && v <= 99

export const getPulseStatus = (v) => {
  if (v > 130 || v < 40) return 'red'
  if (v > 100 || v < 55) return 'yellow'
  return 'green'
}

export const getSpo2Status = (v) => {
  if (v < 90) return 'red'
  if (v < 94) return 'yellow'
  return 'green'
}

export const getTempStatus = (v) => {
  if (v > 103 || v < 95) return 'red'
  if (v > 101 || v < 97) return 'yellow'
  return 'green'
}

export const formatTimestamp = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export const timeAgo = (ts) => {
  if (!ts) return '—'
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

export const normaliseForChart = (pulse, spo2, temp) => ({
  pulse_norm: Math.min(100, (pulse / 200) * 100),
  spo2_norm:  spo2,
  temp_norm:  Math.min(100, Math.max(0, ((temp - 95) / 11) * 100)),
})
