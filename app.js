import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import Task from './models/Task.js';

mongoose.connect(process.env.DATABASE_URL).then(()=> console.log('Connect to DB'));


const app = express();

const corsOption = {
  origin: ['http://127.0.0.1:3000', 'https://buffso-pandamarket.netlify.app/'],
};


app.use(express.json()); //json 객체를 자바스크립트 객체로 변환 <= POST나 PATCH 하려면 사용해야
app.use(cors(corsOption));


function asyncHandler(handler) {
  // 함수를 인수로 받아서 함수를 반환한다.
  const newHandler = async function(req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      if (e.name === 'ValidationError') {
        res.status(400).send({message: e.message});
      } else if (e.name === 'CastError') {
        res.status(404).send({ message: 'Cannot find given id'});
      } else {
        res.status(500).send( { message: e.message })
      }
    }
  }
  return newHandler;
}

app.post('/tasks', asyncHandler(async (req, res) => {
  const newTask = await Task.create(req.body)
  res.status(201).send(newTask);
}));



app.get('/tasks', asyncHandler(async (req, res) => {
  const sort = req.query.sort;
  const count = Number(req.query.count);
  const sortOption = { createdAt: sort === 'oldest' ? 'asc' : 'desc'};

  const tasks = await Task.find().sort(sortOption).limit(count);    // full scan
  res.send(tasks);
}));

app.get('/tasks/:id', async (req, res) => {
  //const id = Number(req.params.id);   
  const id = req.params.id;   // 몽고디비는 문자열

  //const task = mockTasks.find((task) => task.id ===id)
  const task = await Task.findById(id);
  if (task) {
    res.send(task);
  } else {
    res.status(404).send({message: '없습니다'});
  }
});

// patch 안됨 ㅠㅠ
app.patch('/tasks/:id', asyncHandler( async (req, res) => {
  const id = req.params.id;
  const task = await Task.findById(id); // DB 로부터 데이터를 가져왔다.

  if (task) {
    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key];        // 그 데이터를 수정했다.
    });
    const updatedTask = await task.save();            // (소문자 task) 디비와 동기화(변경을 전송)
    console.log('T', task);
    console.log('U', updatedTask);

    res.send(task);               // HTTP 응답을 클라이언트에 보내는 것이다.
  } else {
    res.status(404).send({message: '없습니다'});
  }
}));

app.delete('/tasks/:id', asyncHandler( async (req, res) => {
  const id = req.params.id;
  const task = await Task.findByIdAndDelete(id);

  if (task) {
    res.send(task);
  } else {
    res.status(404).send({message: '없습니다'});
  }
}));

app.listen(process.env.PORT, () => console.log("server on"));
console.log('Hi');