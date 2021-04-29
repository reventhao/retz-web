<template>
  <div>
    <div class="button-group">
      <Button type="primary" icon="ios-add-circle-outline" @click="taskDialog = true">添加
      </Button>
      <Button type="success" icon="ios-download-outline" @click="exportCsv(true)">导出选中数据</Button>
      <Button type="success" icon="ios-download-outline" @click="exportCsv(false)">导出全部</Button>
    </div>
    <Table ref="taskTable" border :columns="taskColumn" :data="taskList" @on-selection-change="onSelectChange">
      <template slot-scope="scope" slot="status">
        <Tag :color="scope.row.status===1?'green':'volcano'">{{ scope.row.status === 1 ? '运行中' : '已停止' }}</Tag>
      </template>
      <template slot-scope="scope" slot="action">
        <Button shape="circle" icon="ios-cog" type="primary" style="margin-right: 5px"
                @click="taskDialog = true; taskForm = JSON.parse(JSON.stringify(scope.row))">
        </Button>
        <Button shape="circle" :icon="processStatus(scope.row.status).icon" :type="processStatus(scope.row.status).type"
                style="margin-right: 5px" @click="confirmRun(scope.row)">
        </Button>
        <Button type="error" icon="ios-trash" @click="confirmRemove(scope.row.taskId)" shape="circle"></Button>
      </template>
    </Table>
    <Modal v-model="taskDialog" @on-ok="processTask()" @on-visible-change="visibleChange">
      <template slot="header">
        <p>{{ taskForm.taskId ? '添加任务' : '编辑任务' }}</p>
      </template>
      <Form ref="taskForm" :rules="taskRule" :model="taskForm" :label-width="70"
            label-position="left">
        <FormItem label="任务名" prop="taskName">
          <Input v-model="taskForm.taskName" placeholder="请输入任务名"></Input>
        </FormItem>
        <FormItem label="执行器" prop="taskClass">
          <Input v-model="taskForm.taskClass" placeholder="请输入执行器"></Input>
        </FormItem>
        <FormItem label="表达式" prop="cron">
          <Input v-model="taskForm.cron" placeholder="请输入表达式"></Input>
        </FormItem>
        <FormItem label="备注" prop="remark">
          <Input v-model="taskForm.remark" placeholder="请输入备注"></Input>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
<script>
export default {
  data: () => ({
    selectTask: [],
    taskDialog: false,
    taskForm: {
      taskName: "",
      taskClass: "",
      cron: "",
      remark: ""
    },
    taskRule: {
      taskName: [
        {required: true, message: '任务名不能为空', trigger: 'blur'}
      ],
      taskClass: [
        {required: true, message: '执行器不能为空', trigger: 'blur'},
      ],
      cron: [
        {required: true, message: '表达式不能为空', trigger: 'blur'}
      ]
    },
    taskColumn: [
      {
        type: 'selection',
        width: 60,
        align: 'center'
      },
      {
        title: "任务ID",
        key: "taskId",
        width: '80',
        align: 'center'
      },
      {
        title: "任务名",
        key: "taskName",
        width: '170',
        align: 'center'
      },
      {
        title: "表达式",
        key: "cron",
        width: '180',
        align: 'center'
      },
      {
        title: "执行器",
        key: "taskClass",
        width: '400',
        align: 'center'
      },
      {
        title: "状态",
        width: '130',
        slot: 'status',
        align: 'center'
      },
      {
        title: "备注",
        key: "remark",
        width: '130',
        align: 'center'
      },
      {
        title: "操作",
        slot: 'action',
        align: 'center'
      }
    ],
    taskList: []
  }),
  mounted() {
    this.loadTaskList(1, 10);
  },
  methods: {
    loadTaskList(pageNum, pageSize) {
      this.$http.get("task?pageNum=" + pageNum + "&pageSize=" + pageSize)
          .then(res => {
            if (res && res.code === 200) {
              this.taskList = res.data.records
            } else {
              this.$Message.error("加载数据失败!")
            }
          })
    },
    visibleChange(visiable) {
      if (!visiable) {
        this.taskForm = {
          taskName: "",
          taskClass: "",
          cron: "",
          remark: ""
        }
      }
    },
    confirmRun(task) {
      this.$Modal.confirm({
        title: "提示",
        content: "确认" + (task.status === 1 ? '停止' : '运行') + "任务?",
        okText: "确定",
        cancelText: "取消",
        onOk: () => {
          if (task.status === 1) {
            this.stopTask(task)
          } else {
            this.startTask(task)
          }
        }
      })
    },
    onSelectChange(data) {
      this.selectTask = data;
    },
    processStatus(status) {
      let style = {}
      if (status === 1) {
        style.icon = 'ios-pause'
        style.text = '停止'
        style.type = 'warning'
      } else {
        style.icon = 'ios-play'
        style.text = '运行'
        style.type = 'success'
      }
      return style;
    },
    processTask() {
      this.$refs.taskForm.validate((valid) => {
        if (valid) {
          if (this.taskForm.taskId) {
            this.editTask();
          } else {
            this.addTask();
          }
        }
      })
    },
    addTask() {
      this.$http.post("task", this.taskForm)
          .then(res => {
            if (res && res.code === 200) {
              this.$Message.success("添加成功")
              this.taskDialog = false;
            } else {
              this.$Message.error(res.msg)
            }
          })
    },
    editTask() {
      this.$http.put("task", this.taskForm)
          .then(res => {
            if (res && res.code === 200) {
              this.$Message.success("修改成功")
              this.loadTaskList(1, 10)
              this.taskDialog = false;
            } else {
              this.$Message.error(res.msg)
            }
          })
    },
    confirmRemove(taskId) {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>是否删除该定时任务?</p>',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          this.$http.delete("task/" + taskId)
              .then(res => {
                if (res && res.code === 200) {
                  this.$Message.success("删除成功")
                  this.loadTaskList(1, 10)
                } else {
                  this.$Message.error(res.msg)
                }
              })
        }
      });
    },
    startTask(task) {
      this.$http.patch("task/start/" + task.taskId)
          .then(res => {
            if (res && res.code === 200) {
              task.status = 1
              this.$Message.success("启动成功")
            } else {
              this.$Message.error(res.msg)
              this.loadTaskList(1, 10)
            }
          })
    },
    stopTask(task) {
      this.$http.patch("task/stop/" + task.taskId)
          .then(res => {
            if (res && res.code === 200) {
              task.status = 0
              this.$Message.success("停止成功")
            } else {
              this.$Message.error(res.msg)
              this.loadTaskList(1, 10)
            }
          })
    },
    exportCsv(flag) {
      if (flag && this.selectTask.length < 1) {
        this.$Message.warning("请选择数据导出")
        return;
      }
      this.$refs.taskTable.exportCsv({
        filename: "任务列表",
        quoted: true,
        columns: this.taskColumn,
        data: flag ? this.selectTask : this.taskList
      })
    }
  }
}
</script>
<style>
.button-group {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.button-group button {
  margin-right: 3px;
}
</style>