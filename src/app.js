const express = require("express");
const moment = require("moment");
const fs = require("fs");
const { allResults } = require("./result");
const { students } = require("./students");
const { classes } = require("./classes");
const { staffs } = require("./staffs");
const { campus } = require("./campus");
const { preSchoolSubjects } = require("./preschool-subjects");
const { departments } = require("./departments");
const { subjects } = require("./subjects");
const { tcomments } = require("./teachers-comments");
const { pcomments } = require("./principal-comments");
const { nStaffs } = require("./new-staffs");
const { skills } = require("./skills");
const { resumption } = require("./resumption");
const { attendance } = require("./attendance");
const { nStudents } = require("./new-students");

const app = express();

const formatDate = (date, format) =>
  moment(date, format).format().split("T")[0];

const formatPhoneNumber = (phoneNumber) => {
  if (phoneNumber && phoneNumber.startsWith("0")) {
    return "+234" + phoneNumber.slice(1);
  }
  return phoneNumber;
};

const writeFile = (fileName, data, header) => {
  const file = fs.createWriteStream(fileName);
  if (header) file.write(data);
  file.write(data);
  file.end();
};

const role = {
  Admin: 1,
  Account: 2,
  Principal: 3,
  Teacher: 4,
  Student: 5,
  Superadmin: 6,
};

const remark = {
  Excellent: 5,
  "Very Good": 4,
  Good: 4,
  Fair: 3,
  Poor: 2,
  "Very Poor": 1,
};

app.get("/resumption", (req, res) => {
  const newResumption = resumption.reduce((a, b) => {
    const f = {
      term: b.term,
      session: b.session,
      session_ends: b.thistermends,
      session_resumes: b.nexttermbegins,
    };
    a[b.campus] = [...(a[b.campus] ?? []), f];

    return a;
  }, {});

  const obj = {
    result: newResumption,
  };

  writeFile("resumption.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/subjects", (req, res) => {
  const newSubject = subjects.reduce((a, b) => {
    const d = {
      // class_name: b.classid,
      // subject: b.subjt,
      class_name: b.class,
      subject: b.name,
    };
    if (!a[b.campus]) {
      a[b.campus] = [d];
    } else {
      a[b.campus] = [...a[b.campus], d];
    }
    return a;
  }, {});

  const obj = {
    result: newSubject,
  };

  writeFile("subjects.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/departments", (req, res) => {
  const newDepartments = departments.reduce((a, b) => {
    const d = { department_id: b.name, department_name: b.name };
    if (!a[b.campus]) {
      a[b.campus] = [d];
    } else {
      a[b.campus] = [...a[b.campus], d];
    }
    return a;
  }, {});

  const obj = {
    result: newDepartments,
  };

  writeFile("departments.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/preschool-subjects", (req, res) => {
  const newDBFormat = preSchoolSubjects.reduce((a, b) => {
    const format = {
      period: b.period,
      session: b.session,
      term: b.term,
      class_id: b.classid,
      class: b.classid,
      subjects: [{ subject: b.subject, topic: [{ name: b.question }] }],
    };

    a.push(format);

    return a;
  }, []);

  const mergeSubjects = newDBFormat.reduce((a, b) => {
    const findItem = a?.find(
      (i) =>
        i.class === b.class &&
        i.period === b.period &&
        b.term === i.term &&
        b.session === i.session
    );

    if (!findItem) {
      a.push(b);
    } else {
      const newArr = a?.map((i) => {
        if (
          i.class === b.class &&
          i.period === b.period &&
          b.term === i.term &&
          b.session === i.session
        ) {
          return { ...i, subjects: [...i.subjects, ...b.subjects] };
        }

        return i;
      });

      a = newArr;
    }

    return a;
  }, []);

  const newPreSchoolSubjects = mergeSubjects.map((item) => ({
    ...item,
    subjects: item.subjects.reduce((a, b) => {
      const findSubject = a?.find((j) => j.subject === b.subject);
      if (!findSubject) {
        a.push(b);
      } else {
        const newArr = a?.map((j) => {
          if (j.subject === b.subject)
            return { ...j, topic: [...j.topic, ...b.topic] };
          return j;
        });
        a = newArr;
      }

      return a;
    }, []),
  }));

  const obj = {
    result: { "Early Spring Nursery School": newPreSchoolSubjects },
  };

  const subjects = newPreSchoolSubjects.reduce((a, b) => {
    a = [...a, ...b.subjects];
    return a;
  }, []);

  writeFile("subjects-by-preschool.json", JSON.stringify(obj));
  writeFile("preschool-subjects.json", JSON.stringify({ result: subjects }));

  res.json(obj);
});

app.get("/campus", (req, res) => {
  const newCampus = campus.map((c) => {
    const format = {
      name: c.campusname,
      email: c.campusemail,
      phoneno: formatPhoneNumber(c.campusphone?.split(",")[0]),
      address: c.campusaddress,
      state: c.campusstate,
      image: "",
    };

    return format;
  });

  const obj = { result: newCampus };

  writeFile("campus.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/staffs", (req, res) => {
  const newStaffs = staffs.reduce((init, staff) => {
    const format = {
      designation_id: role[staff.dstn],
      department: staff.department,
      surname: staff.sun,
      firstname: staff.fn,
      middlename: staff.mn,
      username: staff.email,
      email: staff.email,
      phoneno: formatPhoneNumber(staff.phn),
      address: staff.address,
      status: staff.acctstatz,
      class_assigned: staff.clshead,
    };
    if (init[staff.campus]) {
      init[staff.campus] = [...init[staff.campus], format];
    } else {
      init[staff.campus] = [format];
    }

    return init;
  }, {});

  const obj = { result: newStaffs };

  writeFile("staffs.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/classes", (req, res) => {
  const newClasses = classes.reduce((init, cl) => {
    const format = {
      class_name: cl.name,
      sub_class: "",
    };
    if (init[cl.campus]) {
      init[cl.campus] = [...init[cl.campus], format];
    } else {
      init[cl.campus] = [format];
    }

    return init;
  }, {});

  const obj = { result: newClasses };

  writeFile("classes.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/students", (req, res) => {
  const newSudents = students.reduce((init, student) => {
    const format = {
      surname: student.sun,
      firstname: student.fn,
      middlename: student.mn,
      admission_number: student.admsno,
      genotype: student.genotype,
      blood_group: student.bgroup,
      gender: student.sex,
      dob: formatDate(
        new Date(
          `${student.dob.replace(/\D/g, "")} ${student.mob} ${student.yob}`
        ),
        "YY-MM-DD"
      ),
      nationality: student.nationality,
      state: student.state,
      session_admitted: student.sadmit,
      class: student.cladmit,
      present_class: student.nowclas,
      sub_class: "",
      image: student.pix,
      home_address: student.haddr,
      phone_number: formatPhoneNumber(student.phn?.split(",")[0]),
      email_address: student.eml,
    };
    if (init[student.campus]) {
      init[student.campus] = [...init[student.campus], format];
    } else {
      init[student.campus] = [format];
    }

    return init;
  }, {});

  const obj = { result: newSudents };

  writeFile("students.json", JSON.stringify(obj));

  res.json(obj);
});

app.get("/results", (req, res) => {
  const firstHalf = allResults.reduce((a, b) => {
    const student = nStudents.find(x => x.admission_number === b.admsno)
    const d = {
      student_id: student?.id,
      student_fullname: b.nm,
      admission_number: b.admsno,
      class_name: b.classid,
      period: b.period,
      term: b.term,
      session: b.session,
      results: [{ subject: b.subjt, score: b.total }],
    };

    if (b.period === "First Half") {
      const exists = a[b.campus]?.find(
        (x) =>
          x.student_fullname === d.student_fullname &&
          x.admission_number === d.admission_number &&
          x.class_name === d.class_name &&
          x.period === d.period &&
          x.term === d.term &&
          x.session === d.session
      );
      if (exists) {
        const n = a[b.campus]?.map((x) => {
          if (
            x.student_fullname === d.student_fullname &&
            x.admission_number === d.admission_number &&
            x.class_name === d.class_name &&
            x.period === d.period &&
            x.term === d.term &&
            x.session === d.session
          )
            return { ...x, results: [...x.results, ...d.results] };
          return x;
        });
        a[b.campus] = n;
      } else {
        a[b.campus] = [...(a[b.campus] ?? []), d];
      }
    }

    return a;
  }, {});

  const secondHalf = allResults.reduce((a, b) => {
    const student = nStudents.find(x => x.admission_number === b.admsno)
    const teacher_comment = tcomments.filter(
      (x) =>
        x.admsno === b.admsno && x.period === "Second Half" && x.term === b.term
    );
    const hos_comment = pcomments.filter(
      (x) =>
        x.admsno === b.admsno && x.period === "Second Half" && x.term === b.term
    );
    const att = attendance.find(
      (x) =>
        x.admsno === b.admsno &&
        x.period === "Second Half" &&
        x.term === b.term &&
        b.campus === x.campus &&
        x.session === b.session
    );
    const teacher = nStaffs.find(
      (x) =>
        x.surname === teacher_comment[0]?.tsun?.trim() &&
        x.firstname === teacher_comment[0]?.tfn?.trim() &&
        x.middlename === teacher_comment[0]?.tmn?.trim()
    );

    const skill = skills?.reduce((x, y) => {
      if (
        y.admsno === b.admsno &&
        y.session === b.session &&
        y.period === "Second Half" &&
        y.term === b.term
      ) {
        if (y.domain.split(" ").includes("AFFECTIVE")) {
          x.affective_disposition = [
            ...(x?.affective_disposition ?? []),
            { [y.atribute]: remark[y.remark] },
          ];
        }
        if (y.domain.split(" ").includes("PSYCHOMOTOR")) {
          x.psychomotor_skills = [
            ...(x?.psychomotor_skills ?? []),
            { [y.atribute]: remark[y.remark] },
          ];
        }
      }

      return x;
    }, {});

    const d = {
      student_id: student?.id,
      student_fullname: b.nm,
      admission_number: b.admsno,
      class_name: b.classid,
      period: b.period,
      term: b.term,
      session: b.session,
      school_opened: att?.tresum,
      times_present: att?.tpresent,
      times_absent: att?.tabsent,
      results: [
        {
          subject: b.subjt,
          score: b.exam,
        },
      ],
      teacher_comment: teacher_comment[0]?.tcomment ?? "",
      teacher_id: teacher?.id ?? "",
      hos_comment: hos_comment[0]?.pcomment ?? "",
      hos_id: "102",
      ...skill,
    };

    if (b.period === "Second Half") {
      const exists = a[b.campus]?.find(
        (x) =>
          x.student_fullname === d.student_fullname &&
          x.admission_number === d.admission_number &&
          x.class_name === d.class_name &&
          x.period === d.period &&
          x.term === d.term &&
          x.session === d.session
      );
      if (exists) {
        const n = a[b.campus]?.map((x) => {
          if (
            x.student_fullname === d.student_fullname &&
            x.admission_number === d.admission_number &&
            x.class_name === d.class_name &&
            x.period === d.period &&
            x.term === d.term &&
            x.session === d.session
          )
            return { ...x, results: [...x.results, ...d.results] };
          return x;
        });
        a[b.campus] = n;
      } else {
        a[b.campus] = [...(a[b.campus] ?? []), d];
      }
    }

    return a;
  }, {});

  writeFile("first.json", JSON.stringify(firstHalf));
  writeFile("second.json", JSON.stringify(secondHalf));

  res.json({ result: secondHalf });
});

module.exports = app;
