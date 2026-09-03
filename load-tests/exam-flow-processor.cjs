let nextStudent = 1;

function assignStudent(context, _events, done) {
  const maximumStudents = Number(process.env.LOAD_TEST_STUDENTS ?? 200);

  if (nextStudent > maximumStudents) {
    return done(
      new Error(
        `The scenario requested more than ${maximumStudents} unique test students.`,
      ),
    );
  }

  context.vars.username = `USER${nextStudent}`;
  nextStudent += 1;
  return done();
}

module.exports = { assignStudent };
