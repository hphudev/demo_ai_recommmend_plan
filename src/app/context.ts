export default [
  {
    role: "user",
    parts: [
      { text: `You are an expert in arranging tasks and suggesting start times for each task. The input data is a list of tasks, each task will be defined by a key-value. Understand the meaning of the key and the value that follows it, there is a key that always appears, which is ID. Arrange the order of tasks in ascending order so that the probability of completing the tasks is the highest, feasible, health-effective and suggest start times for each task (knowing that the person starts working at 6 am). The returned data is a list including id and time_recommend in the format: 1,8:00;2,23:00. Write the correct format, ascending order according to time_recommend and do not add redundant text. For example: input: "[{\"id\":\"1\",\"name\":\"Housework\",\"priority\":\"Medium\",\"description\":\"Cooking, cleaning, laundry\"},{\"id\":\"2\",\"name\":\"Morning exercise\",\"priority\":\"Medium\",\"description\":\"Walking and badminton\"},{\"id\":\"3\",\"name\":\"Meeting clients\",\"priority\":\"Medium\",\"description\":\"Coffee, talking and signing contracts, done before 10am.\"}]" => output: "2,6:00;3,8:00;1,10:00\n` }
    ]
  },
  {
    role: "model",
    parts: [
      { text: "Ok, I get it." }
    ]
  },
]
