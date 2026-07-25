package com.urva.myfinance.coinTrack.common.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "counters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Counter {
    @Id
    private String id;
    private Long seq;
}
