export const COURSE_DESIGN_STORE_KEY = 'classweave-course-design-plans-v1'

export function readCourseDesignPlans() {
  try {
    const raw = localStorage.getItem(COURSE_DESIGN_STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('Failed to read course design plans:', error)
    return []
  }
}

export function writeCourseDesignPlans(plans) {
  localStorage.setItem(COURSE_DESIGN_STORE_KEY, JSON.stringify(Array.isArray(plans) ? plans : []))
  window.dispatchEvent(new CustomEvent('course-design-plans-updated'))
}

export function upsertCourseDesignPlan(plan) {
  if (!plan?.id) return
  const plans = readCourseDesignPlans()
  const index = plans.findIndex((item) => item.id === plan.id)
  const nextPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  }
  if (index >= 0) {
    plans.splice(index, 1, { ...plans[index], ...nextPlan })
  } else {
    plans.unshift(nextPlan)
  }
  writeCourseDesignPlans(plans)
}

export function deleteCourseDesignPlan(planId) {
  const plans = readCourseDesignPlans().filter((item) => String(item.id) !== String(planId))
  writeCourseDesignPlans(plans)
}

export function readCourseDesignLesson(planId, lessonKey) {
  const plan = readCourseDesignPlans().find((item) => String(item.id) === String(planId))
  if (!plan) return null
  const lesson = (plan.lessons || []).find((item) => String(item.key) === String(lessonKey))
  return lesson ? { plan, lesson } : null
}
