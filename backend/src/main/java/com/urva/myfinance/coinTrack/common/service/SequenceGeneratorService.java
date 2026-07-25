package com.urva.myfinance.coinTrack.common.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.model.Counter;

@Service
public class SequenceGeneratorService {

    private final MongoTemplate mongoTemplate;

    @Autowired
    public SequenceGeneratorService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public long getNextSequence(String seqName) {
        Query query = new Query(Criteria.where("_id").is(seqName));
        Update update = new Update().inc("seq", 1L);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true).upsert(true);

        Counter counter = mongoTemplate.findAndModify(query, update, options, Counter.class);
        return counter != null && counter.getSeq() != null ? counter.getSeq() : 1L;
    }
}
