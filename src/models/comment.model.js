import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: {
        type: String,
        require: true
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    }
}, { timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate) // give me the ability for paginate where to where to play video 

export const Comment = mongoose.model('Comment', commentSchema)