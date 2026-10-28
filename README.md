# 🎯 ConceptRadar — Smart Classroom Learning Analytics

> An interactive analytics dashboard for computer science instructors to diagnose student struggle topics, visualize mistake ratios, and receive automated pedagogical revision plans.

Built for college hackathons and academic evaluations.

---

## 🌟 Key Features

1. **Classroom Learning Dashboard**
   - KPI metrics: Cohort size (1–10 students), class average score (/10 and /30), topics evaluated.
   - Prominent **Weakest Topic Spotlight** with mistake percentages.
   - Dynamic Chart.js bar charts for **Average Score** and **Topic Error Rate**.
   - Prioritized revision checklist with estimated lab durations.

2. **Student Score Management**
   - Support for 1 to 10 students.
   - Real-time input validation for quiz scores ($0$ to $10$ points across Arrays, Loops, and Functions).
   - Live row sum totals and cohort counter.
   - 1-click preset loader for realistic demonstration data.

3. **Concept Error & Mastery Analysis**
   - Detailed topic diagnostic table ranking concepts from highest struggle to lowest.
   - Multivariate **Concept Mastery Radar Chart**.
   - Actionable pedagogical interventions customized to the diagnosed roadblock.

4. **Student Performance Records**
   - Real-time search by student name.
   - Multi-tier filtering (*All*, *Needs Support < 60%*, *Average 60%–79%*, *High Performers ≥ 80%*).
   - Multi-field sorting by total points, topic scores, or alphabetical order.
   - Individual student inspection modal with class ranking and personalized study plans.

5. **Reports & Data Export**
   - Formal Academic Diagnostic Summary.
   - **Downloadable CSV report** with full cohort and concept statistics.
   - Print-optimized stylesheet (`window.print()`) for PDF generation with official instructor sign-off lines.

---

## 📐 Calculation Engine Rules

ConceptRadar operates on strict mathematical formulation:

- **Total Score** = $\sum (\text{student scores for a topic})$
- **Possible Marks** = $\text{Number of students} \times 10$
- **Average Score** = $\frac{\text{Total Score}}{\text{Number of students}}$
- **Mistakes** = $\text{Possible Marks} - \text{Total Score}$
- **Error Percentage** = $\left(\frac{\text{Mistakes}}{\text{Possible Marks}}\right) \times 100$
- **Weakest Topic** = The topic with the highest Error Percentage

---

## 🚀 Deployment (Vercel)

This project is a 100% static client-side web application and requires zero backend build steps.

### Deploying via GitHub + Vercel:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete ConceptRadar platform"
   git remote add origin https://github.com/<your-username>/concept-radar.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New..."** → **"Project"**.
3. Import the `concept-radar` repository.
4. Click **"Deploy"** (Vercel automatically detects the static HTML/CSS/JS site and deploys in seconds).
