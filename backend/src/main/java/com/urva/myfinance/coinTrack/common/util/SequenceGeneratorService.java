package com.urva.myfinance.coinTrack.common.util;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import static org.springframework.data.mongodb.core.FindAndModifyOptions.options;
import org.springframework.data.mongodb.core.MongoOperations;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class SequenceGeneratorService {

    @Autowired
    private MongoOperations mongoOperations;

    public String generateSequence(String seqName) {
        try {
            DatabaseSequence counter = mongoOperations.findAndModify(
                    query(where("_id").is(seqName)),
                    new Update().inc("seq", 1),
                    options().returnNew(true).upsert(true),
                    DatabaseSequence.class);

            return String.valueOf(!Objects.isNull(counter) ? counter.getSeq() : 1);
        } catch (Exception e) {
            throw new RuntimeException("Error generating sequence for: " + seqName + ". " + e.getMessage(), e);
        }
    }
}
