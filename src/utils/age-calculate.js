exports.calAge =  (dob,n) => {
  var dob = new Date(dob);  
    
  //extract the year, month, and date from user date input  
  var dobYear = dob.getYear();  
  var dobMonth = dob.getMonth();  
  var dobDate = dob.getDate();  
    
  //get the current date from the system  
  var now = n ? new Date(n) : new Date();  
  //extract the year, month, and date from current date  
  var currentYear = now.getYear();  
  var currentMonth = now.getMonth();  
  var currentDate = now.getDate();  
    
  //declare a variable to collect the age in year, month, and days  
  var age = {};  
  var ageString = "";  
  
  //get years  
  var yearAge = currentYear - dobYear;  
    
  //get months  
  if (currentMonth >= dobMonth)  
    //get months when current month is greater  
    var monthAge = currentMonth - dobMonth;  
  else {  
    yearAge--;  
    var monthAge = 12 + currentMonth - dobMonth;  
  }  

  //get days  
  if (currentDate >= dobDate)  
    //get days when the current date is greater  
    var dateAge = currentDate - dobDate;  
  else {  
    monthAge--;  
    var dateAge = 31 + currentDate - dobDate;  

    if (monthAge < 0) {  
      monthAge = 11;  
      yearAge--;  
    }  
  }  
  //group the age in a single variable  
  var age = {  
      years: yearAge,  
      months: monthAge,  
      days: dateAge  
  };  
      
  var  ageString = "";
  let ageNumber = 0;
     
  if ( (age.years > 0) && (age.months > 0) && (age.days > 0) )  
     ageString = age.years + "." + age.months + " ปี " 
    //  + age.days + " วัน";  
  else if ( (age.years == 0) && (age.months == 0) && (age.days > 0) )  
     ageString = age.days + " วัน";  
  else if ( (age.years > 0) && (age.months == 0) && (age.days == 0) )  
    ageString = age.years +  " ปี (วันเกิด)";  
  else if ( (age.years > 0) && (age.months > 0) && (age.days == 0) )  
    ageString = age.years + "." + age.months + " ปี ";  
  else if ( (age.years == 0) && (age.months > 0) && (age.days > 0) )  
    ageString = age.months + "." + age.days + " เดือน ";  
  else if ( (age.years > 0) && (age.months == 0) && (age.days > 0) )  
    ageString = age.years + " ปี " 
    // + age.days + " วัน";  
  else if ( (age.years == 0) && (age.months > 0) && (age.days == 0) )  
    ageString = age.months + " เดือน";  

  ageNumber = age.years + "." + age.months + "." + age.days;

  return {ageString,ageNumber}; 
}
