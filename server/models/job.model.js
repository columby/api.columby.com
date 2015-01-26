'use strict';


module.exports = function(sequelize, DataTypes) {



  /**
   *
   * Schema definition
   *
   */
  var Job = sequelize.define('Job', {

      // type of job
      type: {
        type: DataTypes.STRING
      },
      // Extra data required for the job
      data: {
        type: DataTypes.TEXT
      },
      // Status of the job
      // [active,processing,error,done]
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
      },
      // Progress counter
      progress: {
        type: DataTypes.INTEGER
      },
      // Error Message
      error: {
        type: DataTypes.TEXT
      },
      // Failure date
      failed_at: {
        type: DataTypes.DATE
      },
      // Duration of the job in seconds.
      duration: {
        type: DataTypes.INTEGER
      },
      log: {
        type: DataTypes.TEXT
      },
      dataset_id:{
        type: DataTypes.INTEGER
      },
      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }

    }
  );

  //Job.sync();

  return Job;
};
