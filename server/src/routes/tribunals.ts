import { Router } from 'express'
import { TRIBUNALS } from '../tribunals.js'

const router = Router()

router.get('/', (req, res) => {
  const list = Object.values(TRIBUNALS).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    tone: t.tone,
    scoreLabel: t.scoreLabel,
    possibleVerdicts: t.possibleVerdicts,
    panelAgents: t.panelAgents.map((a) => ({ name: a.name, role: a.role })),
  }))
  res.json(list)
})

export default router
