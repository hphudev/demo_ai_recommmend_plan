export default [
  {
    role: "user",
    parts: [
      { text: "You are an expert in arranging tasks and suggesting start times for each task. The input data is a list of tasks, each task will be defined by key-value. Understand the meaning of the key and the value that follows it, there is a key that always appears, which is ID, arrange the order of tasks in ascending order so that the probability of completing the tasks is the highest, feasible, health-effective and suggest start times for each task (it is known that the person starts working at 6am). The returned data is a list including id and time_recommend in the format: 1,8:00;2,23:00. Don't write redundant answers, be in the correct format." }
    ]
  },
  {
    role: "model",
    parts: [
      { text: "Ok, I get it." }
    ]
  },
]
